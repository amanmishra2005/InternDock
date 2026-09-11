import React, { useEffect, useRef, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react";
import api from "../api/axios";

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToInputValue(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Apply() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const queryDurationId = searchParams.get("durationId");

  const [domain, setDomain] = useState(null);
  const [durationId, setDurationId] = useState("");
  const [startDate, setStartDate] = useState(getTodayInputValue);
  const [endDate, setEndDate] = useState("");
  const endDateEdited = useRef(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/domains/${slug}`).then((res) => {
      setDomain(res.data);
      if (res.data.availableDurations?.length) {
        // Use pre-selected durationId from query params, or default to first duration
        const matched = res.data.availableDurations.find(
          (d) => d._id === queryDurationId,
        );
        setDurationId(
          matched ? matched._id : res.data.availableDurations[0]._id,
        );
      }
    });
  }, [slug, queryDurationId]);

  const selectedDuration =
    domain?.availableDurations?.find((d) => d._id === durationId) ||
    domain?.availableDurations?.[0];

  useEffect(() => {
    if (!startDate || !selectedDuration?.weeks || endDateEdited.current) return;
    setEndDate(addDaysToInputValue(startDate, selectedDuration.weeks * 7 - 1));
  }, [startDate, selectedDuration?.weeks]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
      setError("Choose a valid internship start and end date.");
      setSubmitting(false);
      return;
    }
    try {
      await api.post("/applications", {
        domainId: domain._id,
        durationId,
        startDate,
        endDate,
      });
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", {
          replace: true,
          state: { from: `/apply/${slug}` },
        });
        return;
      }
      setError(err.response?.data?.message || "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (!domain) {
    return (
      <div
        className="container"
        style={{ padding: "6rem 1rem", textAlign: "center" }}
      >
        <div className="spinner"></div>
        <p>Loading application configuration...</p>
      </div>
    );
  }

  return (
    <div className="container apply-page-container">
      <Link to={`/domains/${domain.slug}`} className="back-link">
        <ArrowLeft size={16} />
        <span>Back to {domain.name} Details</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel apply-card"
      >
        <span className="badge-pill badge-pill-cyan">
          <ShieldCheck size={14} />
          <span>Official Selection Record</span>
        </span>
        <h1 className="apply-title">Apply for {domain.name}</h1>
        <p className="apply-subtitle">
          Your selected program track duration from domain details is locked
          below. Submit to generate your official InternDock selection offer
          letter &amp; workspace access.
        </p>

        <form onSubmit={submit} className="apply-form">
          {/* Selected Duration Summary Card (No Dual Dropdown Selector) */}
          <div className="selected-duration-badge-card">
            <div className="duration-card-header">
              <Clock size={18} color="#4f46e5" />
              <span>Selected Program Duration Track</span>
              <Link
                to={`/domains/${domain.slug}`}
                className="change-duration-link"
              >
                Change Track
              </Link>
            </div>
            <div className="duration-card-body">
              <div>
                <h3 className="dur-name-label">
                  {selectedDuration?.label ||
                    `${selectedDuration?.weeks} Weeks`}{" "}
                  Track
                </h3>
                <p className="dur-desc-sub">
                  Includes weekly capstone evaluation &amp; mentor feedback
                </p>
              </div>
              <span className="dur-fee-tag">₹{selectedDuration?.fee}</span>
            </div>
          </div>

          <div className="internship-dates-box">
            <div className="dates-box-heading">
              <CalendarDays size={18} color="#0284c7" />
              <div>
                <h3>Choose your internship dates</h3>
                <p>Select when you want your track to begin and finish.</p>
              </div>
            </div>
            <div className="date-fields-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="start-date">
                  Starting date
                </label>
                <input
                  id="start-date"
                  type="date"
                  className="input-field"
                  value={startDate}
                  min={getTodayInputValue()}
                  onChange={(e) => {
                    endDateEdited.current = false;
                    setStartDate(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="end-date">
                  Ending date
                </label>
                <input
                  id="end-date"
                  type="date"
                  className="input-field"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => {
                    endDateEdited.current = true;
                    setEndDate(e.target.value);
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {selectedDuration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="application-summary-box"
            >
              <h3>
                <FileCheck size={16} color="#38bdf8" />
                <span>Application &amp; Pricing Summary</span>
              </h3>
              <div className="summary-row">
                <span>Selected Domain:</span>
                <strong>{domain.name}</strong>
              </div>
              <div className="summary-row">
                <span>Selected Duration:</span>
                <strong>
                  {selectedDuration.label || `${selectedDuration.weeks} Weeks`}{" "}
                  Track
                </strong>
              </div>
              <div className="summary-row">
                <span>Program Fee:</span>
                <strong className="summary-fee">₹{selectedDuration.fee}</strong>
              </div>
              <div className="summary-row">
                <span>Credential Deliverables:</span>
                <span className="deliverables-text flex items-center gap-1">
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Offer Selection Letter + Verified Certificate</span>
                </span>
              </div>
            </motion.div>
          )}

          {error && <div className="error-message-box">{error}</div>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn btn-primary btn-glow full-width btn-lg"
            disabled={submitting}
          >
            <span>
              {submitting
                ? "Processing Application..."
                : `Confirm & Generate Selection Letter (₹${selectedDuration?.fee || 0})`}
            </span>
            <ArrowRight size={18} />
          </motion.button>
        </form>
      </motion.div>

      <style>{`
        .apply-page-container { padding: 4rem 1.5rem; max-width: 720px; margin: 0 auto; }
        .back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #475569 !important; font-size: 0.95rem; font-weight: 700 !important; margin-bottom: 1.5rem; transition: all 0.2s ease; text-decoration: none; }
        .back-link:hover, .back-link:focus, .back-link:active, .back-link:visited { color: #1e3a8a !important; text-decoration: none; }
        .apply-card { padding: 3rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-lg); box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05); }
        .apply-title { font-size: 2.2rem; font-weight: 900; margin: 0.75rem 0 0.5rem 0; color: #0f172a !important; }
        .apply-subtitle { color: #475569 !important; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5; }
        .apply-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .selected-duration-badge-card { background: #f8fafc; border: 2px solid #6366f1; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .duration-card-header { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.03em; }
        .change-duration-link { color: #64748b; font-size: 0.8rem; text-decoration: underline; font-weight: 600; }
        .change-duration-link:hover { color: #4f46e5; }
        .duration-card-body { display: flex; align-items: center; justify-content: space-between; }
        .dur-name-label { font-size: 1.25rem; font-weight: 900; color: #0f172a !important; margin: 0; }
        .dur-desc-sub { font-size: 0.85rem; color: #475569 !important; margin: 0.2rem 0 0 0; }
        .dur-fee-tag { font-size: 1.6rem; font-weight: 900; color: #0284c7 !important; }
        .application-summary-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 1.5rem; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 0.85rem; }
        .internship-dates-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; }
        .dates-box-heading { display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: 1rem; }
        .dates-box-heading h3 { font-size: 0.98rem; color: #0f172a; margin: 0; }
        .dates-box-heading p { color: #475569; font-size: 0.82rem; margin: 0.2rem 0 0; }
        .date-fields-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
        .date-fields-grid .input-group { margin-bottom: 0; }
        .application-summary-box h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 800; color: #0f172a !important; margin-bottom: 0.5rem; }
        .summary-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.925rem; color: #475569 !important; }
        .summary-row strong { color: #0f172a !important; }
        .summary-fee { color: #059669 !important; font-size: 1.1rem; }
        .deliverables-text { color: #059669 !important; font-weight: 700; font-size: 0.875rem; }
        .error-message-box { padding: 0.85rem 1.1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; font-weight: 600; font-size: 0.875rem; border-radius: var(--radius-sm); }
        @media (max-width: 560px) {
          .apply-page-container { padding: 2rem 0.85rem; }
          .apply-card { padding: 1.35rem 1rem; border-radius: var(--radius-md); }
          .apply-title { font-size: clamp(1.6rem, 6vw, 2rem); margin: 0.5rem 0 0.35rem 0; }
          .apply-subtitle { margin-bottom: 1.5rem; font-size: 0.9rem; }
          .selected-duration-badge-card { padding: 1rem 1.15rem; }
          .date-fields-grid { grid-template-columns: 1fr; }
          .duration-card-header, .duration-card-body { align-items: flex-start; gap: 0.6rem; flex-wrap: wrap; }
          .summary-row { flex-direction: column; align-items: flex-start; gap: 0.2rem; }
          .apply-form .btn-lg { white-space: normal; text-align: center; line-height: 1.35; padding: 0.85rem 1rem; font-size: 0.92rem; }
        }
      `}</style>
    </div>
  );
}
