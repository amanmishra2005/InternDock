import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

const STATUS_OPTIONS = ["Submitted", "Under Review", "Selected", "Active", "Completed", "Rejected"];

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Tracks which application is actively in-flight for certificate issuance
  const [issuingId, setIssuingId] = useState(null);
  // Tracks which application is actively in-flight for offer letter issuance
  const [issuingOfferId, setIssuingOfferId] = useState(null);

  // Incomplete Task Warning Confirmation Modal State
  const [warningModal, setWarningModal] = useState({
    open: false,
    application: null,
    taskSummary: null,
  });

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

  // Direct Admin Offer Letter Issuance Handler
  const issueOfferLetter = async (app) => {
    if (issuingOfferId) return;
    setIssuingOfferId(app._id);

    try {
      await api.post(`/admin/applications/${app._id}/issue-offer-letter`);
      alert("Offer letter issued and persisted successfully!");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not issue offer letter");
    } finally {
      setIssuingOfferId(null);
    }
  };

  // Primary Certificate Issuance Handler with Task Completion Verification
  const issueCertificate = async (app) => {
    if (issuingId) return; // Prevent duplicate rapid clicks
    setIssuingId(app._id);

    try {
      // 1. Verify student's task and submission status
      const { data } = await api.get(`/admin/applications/${app._id}/task-status`);

      if (data.allCompleted) {
        // All tasks are completed and approved! Proceed normally without modal
        await api.post(`/admin/applications/${app._id}/issue-certificate`);
        alert("Certificate issued successfully!");
        setIssuingId(null);
        load();
      } else {
        // Incomplete / pending / rejected tasks exist -> display warning confirmation modal
        setWarningModal({
          open: true,
          application: app,
          taskSummary: data,
        });
        setIssuingId(null);
      }
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.requiresConfirmation && resData?.taskSummary) {
        setWarningModal({
          open: true,
          application: app,
          taskSummary: resData.taskSummary,
        });
      } else {
        alert(resData?.message || "Could not verify task completion status");
      }
      setIssuingId(null);
    }
  };

  // Explicit confirmation to issue certificate despite incomplete tasks
  const confirmIssueAnyway = async () => {
    if (!warningModal.application || issuingId) return;
    const app = warningModal.application;
    setIssuingId(app._id);

    try {
      await api.post(`/admin/applications/${app._id}/issue-certificate`, {
        confirmIncomplete: true,
      });
      alert("Certificate issued successfully despite incomplete tasks!");
      setWarningModal({ open: false, application: null, taskSummary: null });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not issue certificate");
    } finally {
      setIssuingId(null);
    }
  };

  // Cancel action closes the modal without issuing certificate, preserving state
  const closeWarningModal = () => {
    setWarningModal({ open: false, application: null, taskSummary: null });
    setIssuingId(null);
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
                  <th>Review Action</th>
                  <th>Offer Letter</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <React.Fragment key={app._id}>
                  <tr>
                    <td>
                      <span className="app-id-tag">{app.applicationId || "N/A"}</span>
                    </td>
                    <td>
                      <div className="student-info-cell">
                        <strong>{app.studentName || app.student?.fullName || "-"}</strong>
                        <span className="email-text">{app.studentEmail || app.student?.email || "-"}</span>
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
                      {app.offerLetterIssued ? (
                        <span className="offer-issued-pill" style={{ color: "#0284c7", fontWeight: 800, fontSize: "0.85rem" }}>
                          ✓ Issued
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
                          onClick={() => issueOfferLetter(app)}
                          disabled={issuingOfferId === app._id}
                        >
                          {issuingOfferId === app._id ? "Issuing..." : "Issue Offer"}
                        </button>
                      )}
                    </td>
                    <td>
                      {app.certificateIssued ? (
                        <span className="cert-issued-pill">✓ Issued</span>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => issueCertificate(app)}
                          disabled={issuingId === app._id}
                        >
                          {issuingId === app._id ? "Processing..." : "Issue Cert"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === app._id && (
                    <tr className="payment-details-row">
                      <td colSpan={8}>
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

      {/* Confirmation Modal for Incomplete Internship Tasks */}
      {warningModal.open && warningModal.application && (
        <div className="modal-backdrop" onClick={closeWarningModal}>
          <div
            className="modal-card confirmation-warning-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-warning">
              <div className="warning-icon-badge">
                <AlertTriangle size={24} color="#d97706" />
              </div>
              <div className="warning-modal-titles">
                <h2 className="warning-modal-title">Incomplete Tasks Warning</h2>
                <span className="warning-modal-sub">
                  Candidate: <strong>{warningModal.application.studentName || warningModal.application.student?.fullName || "Student"}</strong> ({warningModal.application.applicationId || "N/A"})
                </span>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={closeWarningModal}
                disabled={Boolean(issuingId)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="warning-modal-body">
              <div className="warning-notice-banner">
                <AlertCircle size={18} className="notice-icon" />
                <p>
                  This student has not completed all required internship tasks and submissions. Please review the pending or incomplete items below before making a decision.
                </p>
              </div>

              {/* Task Stat Counters */}
              <div className="task-stats-row">
                <div className="task-stat-box stat-completed">
                  <span className="stat-label">Completed &amp; Approved</span>
                  <span className="stat-value">
                    {warningModal.taskSummary?.completed ?? 0} / {warningModal.taskSummary?.totalRequired ?? 0}
                  </span>
                </div>
                <div className="task-stat-box stat-incomplete">
                  <span className="stat-label">Incomplete / Pending</span>
                  <span className="stat-value">
                    {warningModal.taskSummary?.incomplete ?? 0} / {warningModal.taskSummary?.totalRequired ?? 0}
                  </span>
                </div>
              </div>

              {/* Incomplete Tasks Breakdown */}
              <div className="incomplete-tasks-section">
                <h3 className="incomplete-tasks-heading">Remaining / Pending Tasks:</h3>
                {warningModal.taskSummary?.incompleteTasks && warningModal.taskSummary.incompleteTasks.length > 0 ? (
                  <div className="incomplete-tasks-list">
                    {warningModal.taskSummary.incompleteTasks.map((t, idx) => (
                      <div key={idx} className="incomplete-task-item">
                        <div className="incomplete-task-info">
                          <span className="task-name">{t.title}</span>
                          <span className="task-reason-text">{t.reason}</span>
                        </div>
                        <span className={`task-status-tag status-${t.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-tasks-text">No specific pending tasks listed.</p>
                )}
              </div>
            </div>

            <div className="warning-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeWarningModal}
                disabled={Boolean(issuingId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-warning-confirm"
                onClick={confirmIssueAnyway}
                disabled={Boolean(issuingId)}
              >
                {issuingId === warningModal.application._id ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="spinner-icon-sm" />
                    <span>Issuing Certificate...</span>
                  </span>
                ) : (
                  <span>Issue Certificate Anyway</span>
                )}
              </button>
            </div>
          </div>
        </div>
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

        /* Incomplete Task Warning Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }
        .confirmation-warning-modal {
          background: #ffffff;
          width: 100%;
          max-width: 580px;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          animation: modalAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header-warning {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .warning-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .warning-modal-titles {
          flex: 1;
        }
        .warning-modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .warning-modal-sub {
          font-size: 0.82rem;
          color: #64748b;
          display: block;
          margin-top: 0.15rem;
        }
        .warning-modal-sub strong {
          color: #1e293b;
        }
        .btn-modal-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .warning-modal-body {
          padding: 1.25rem 1.5rem;
        }
        .warning-notice-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 0.85rem 1rem;
          color: #92400e;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }
        .notice-icon {
          flex-shrink: 0;
          margin-top: 0.1rem;
          color: #d97706;
        }
        .task-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .task-stat-box {
          padding: 0.85rem 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .stat-completed {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .stat-incomplete {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stat-value {
          font-size: 1.4rem;
          font-weight: 900;
        }
        .incomplete-tasks-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
        }
        .incomplete-tasks-heading {
          font-size: 0.8rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.75rem 0;
        }
        .incomplete-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 180px;
          overflow-y: auto;
        }
        .incomplete-task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          gap: 0.75rem;
        }
        .incomplete-task-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .task-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }
        .task-reason-text {
          font-size: 0.75rem;
          color: #64748b;
        }
        .task-status-tag {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          white-space: nowrap;
        }
        .task-status-tag.status-missing,
        .task-status-tag.status-rejected {
          background: #fee2e2;
          color: #b91c1c;
        }
        .task-status-tag.status-pending-review,
        .task-status-tag.status-needs-revision,
        .task-status-tag.status-under-review {
          background: #fef3c7;
          color: #b45309;
        }
        .no-tasks-text {
          font-size: 0.85rem;
          color: #64748b;
          font-style: italic;
        }
        .warning-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }
        .btn-warning-confirm {
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #ffffff;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .btn-warning-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
        }
        .btn-warning-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spinner-icon-sm {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-container { padding: 2rem 0.85rem; }
          .admin-header { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.35rem 1rem; }
          .admin-title { font-size: 1.6rem; }
          .filter-select-wrapper { width: 100%; }
          .table-card { padding: 0.75rem; }
          .payment-details-panel { grid-template-columns: 1fr; gap: 0.65rem; padding: 0.85rem 1rem; }
          .task-stats-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
