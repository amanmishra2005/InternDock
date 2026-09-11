import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ShieldCheck, Check, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axios";

const STATUS_OPTIONS = ["Submitted", "Under Review", "Selected", "Active", "Completed", "Rejected"];

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    api
      .get(`/admin/applications${q}`)
      .then((res) => setApplications(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/admin/applications/${id}/status`, { status, note: `Changed by admin to ${status}` });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not change status");
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/admin/applications/${id}/mark-payment`);
      alert("Payment approved & candidate workspace activated!");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not approve payment");
    }
  };

  const issueCertificate = async (id) => {
    try {
      await api.post(`/admin/applications/${id}/issue-certificate`);
      alert("Certificate issued successfully!");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not issue certificate");
    }
  };

  return (
    <div className="container admin-container">
      <Link to="/admin" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to Admin Dashboard</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-header glass-panel"
      >
        <div>
          <span className="badge-pill badge-pill-cyan">
            <ShieldCheck size={14} />
            <span>Applications Registry</span>
          </span>
          <h1 className="admin-title">Candidate Applications</h1>
        </div>

        <div className="filter-select-wrapper">
          <select
            className="select-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses ({applications.length})</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="glass-panel text-center" style={{ padding: "4rem", marginTop: "1.5rem" }}>
          <div className="spinner"></div>
          <p>Loading candidate applications...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel table-card" 
          style={{ marginTop: "1.5rem" }}
        >
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Student Details</th>
                  <th>Domain &amp; Track</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action / Change Status</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <React.Fragment key={app._id}>
                  <tr>
                    <td>
                      <span className="app-id-tag">{app.applicationId || app._id.slice(-6)}</span>
                    </td>
                    <td>
                      <div className="student-info-cell">
                        <strong>{app.student?.fullName || "Student Candidate"}</strong>
                        <span className="email-text">{app.student?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="domain-track-cell">
                        <strong>{app.domain?.name}</strong>
                        <span className="duration-tag">{app.duration?.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${app.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <div className="payment-cell">
                        {app.paymentStatus === "Successful" ? (
                          <span className="payment-pill paid flex items-center gap-1">
                            <Check size={12} /> Paid
                          </span>
                        ) : (
                          <button className="btn-approve-paid" onClick={() => markPaid(app._id)}>
                            Approve Paid
                          </button>
                        )}
                        <button
                          className="btn-view-details"
                          onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                        >
                          {app.paymentDetails ? "Details" : "No proof on file"}
                          {expandedId === app._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <select
                        className="select-field select-sm"
                        value={app.status}
                        onChange={(e) => changeStatus(app._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {app.certificateIssued ? (
                        <span className="cert-issued-pill">✓ Issued</span>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => issueCertificate(app._id)}>
                          Issue Cert
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === app._id && (
                    <tr className="payment-details-row">
                      <td colSpan={7}>
                        {app.paymentDetails ? (
                          <div className="payment-details-panel">
                            <div><span>Payer Name</span><strong>{app.paymentDetails.payerName || "-"}</strong></div>
                            <div><span>Registered Email</span><strong>{app.paymentDetails.registeredEmail || "-"}</strong></div>
                            <div><span>UTR / Payment Ref</span><strong>{app.paymentDetails.utrNumber || "-"}</strong></div>
                            <div><span>Amount</span><strong>₹{app.paymentDetails.amount ?? "-"}</strong></div>
                            <div><span>Gateway Status</span><strong>{app.paymentDetails.status || "-"}</strong></div>
                            <div><span>Submitted</span><strong>{app.paymentDetails.createdAt ? new Date(app.paymentDetails.createdAt).toLocaleString() : "-"}</strong></div>
                          </div>
                        ) : (
                          <div className="payment-details-panel empty">
                            No payment record exists for this application yet — the student hasn't submitted proof, or it wasn't captured. Cross-check with them before using "Approve Paid" / "Issue Cert" to override manually.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <style>{`
        .admin-container { padding: 3rem 1.5rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #475569 !important; font-weight: 700; margin-bottom: 1.5rem; text-decoration: none; }
        .back-link:hover, .back-link:focus, .back-link:active, .back-link:visited { color: #1e3a8a !important; text-decoration: none; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; padding: 2rem 2.5rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-lg); }
        .admin-title { font-size: 2.2rem; font-weight: 900; color: #0f172a !important; margin-top: 0.5rem; }
        .filter-select-wrapper { min-width: 240px; }
        .table-card { padding: 1.5rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 1rem; color: #475569 !important; font-size: 0.8rem; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-weight: 800; }
        .admin-table td { padding: 1.1rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #0f172a !important; }
        .student-info-cell { display: flex; flex-direction: column; }
        .student-info-cell strong { font-weight: 700; color: #0f172a !important; }
        .email-text { font-size: 0.825rem; color: #64748b !important; }
        .domain-track-cell { display: flex; flex-direction: column; }
        .domain-track-cell strong { font-weight: 700; color: #0f172a !important; }
        .duration-tag { font-size: 0.775rem; color: #4f46e5 !important; font-weight: 600; }
        .app-id-tag { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; color: #1e3a8a; }
        .status-pill { display: inline-block; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; text-transform: capitalize; }
        .status-submitted, .status-under-review { background: rgba(2, 132, 199, 0.1); color: #0284c7; }
        .status-selected { background: rgba(217, 119, 6, 0.1); color: #d97706; }
        .status-active { background: rgba(99, 102, 241, 0.1); color: #4f46e5; }
        .status-completed { background: rgba(16, 185, 129, 0.1); color: #059669; }
        .status-rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .payment-pill { display: inline-block; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; }
        .payment-pill.paid { background: rgba(16, 185, 129, 0.12); color: #059669; }
        .btn-approve-paid { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; padding: 0.4rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
        .btn-approve-paid:hover { transform: scale(1.05); }
        .select-sm { padding: 0.35rem 0.65rem; font-size: 0.85rem; }
        .cert-issued-pill { color: #059669; font-weight: 800; font-size: 0.85rem; }
        .payment-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem; }
        .btn-view-details { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: 1px solid #cbd5e1; color: #475569; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); cursor: pointer; }
        .btn-view-details:hover { background: #f1f5f9; }
        .payment-details-row td { padding: 0 !important; border-bottom: 1px solid #e2e8f0; }
        .payment-details-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem 1.5rem; padding: 1.1rem 1.5rem; background: #f8fafc; }
        .payment-details-panel div { display: flex; flex-direction: column; gap: 0.15rem; }
        .payment-details-panel span { font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.03em; }
        .payment-details-panel strong { font-size: 0.9rem; color: #0f172a; font-weight: 700; }
        .payment-details-panel.empty { display: block; padding: 1rem 1.5rem; color: #b45309; background: #fffbeb; font-size: 0.85rem; font-weight: 600; }
        @media (max-width: 768px) {
          .admin-container { padding: 2rem 0.85rem; }
          .admin-header { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.35rem 1rem; }
          .admin-title { font-size: 1.6rem; }
          .filter-select-wrapper { width: 100%; }
          .table-card { padding: 0.75rem; }
          .payment-details-panel { grid-template-columns: 1fr; gap: 0.65rem; padding: 0.85rem 1rem; }
        }
      `}</style>
    </div>
  );
}
