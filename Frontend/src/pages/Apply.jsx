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
  CheckCircle2,
  Clock,
  CalendarDays,
  GraduationCap,
  Sparkles,
  Award,
  Check,
  Lock,
  Zap,
  User,
  Mail,
  FileText,
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

function formatDisplayDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
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

  // Prefill candidate info from user profile
  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  })();
  const [collegeName, setCollegeName] = useState(savedUser.college || "");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/domains/${slug}`).then((res) => {
      setDomain(res.data);
      if (res.data.availableDurations?.length) {
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
      setError("Please choose a valid internship start and end date.");
      setSubmitting(false);
      return;
    }
    try {
      await api.post("/applications", {
        domainId: domain._id,
        durationId,
        startDate,
        endDate,
        collegeName: collegeName.trim(),
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
      setError(err.response?.data?.message || "Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!domain) {
    return (
      <div className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading internship track configuration...</p>
      </div>
    );
  }

  return (
    <div className="apply-page-wrapper">
      <div className="container">
        {/* Top Breadcrumb Navigation */}
        <div className="apply-top-nav">
          <Link to={`/domains/${domain.slug}`} className="back-link">
            <ArrowLeft size={16} />
            <span>Back to {domain.name} Details</span>
          </Link>
        </div>

        {/* Header Hero Section */}
        <div className="apply-header-banner">
          <div className="badge-pill badge-pill-cyan">
            <ShieldCheck size={14} />
            <span>Official Candidate Application</span>
          </div>
          <h1 className="apply-page-title">
            Apply for <span className="gradient-text">{domain.name}</span>
          </h1>
          <p className="apply-page-desc">
            Complete your application below to generate your official InternDock Selection Offer Letter and unlock production capstone repository access.
          </p>
        </div>

        {/* 2-Column Split Presentation */}
        <form onSubmit={submit} className="apply-split-layout">
          {/* LEFT COLUMN: Configuration Steps */}
          <div className="apply-form-main-col">
            {/* Step 1: Program Duration Track Selection */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel apply-section-card"
            >
              <div className="section-card-header">
                <div className="step-badge">1</div>
                <div>
                  <h2 className="section-card-title">Select Duration Track</h2>
                  <p className="section-card-subtitle">
                    Choose the duration that fits your schedule. All tracks include mentor code reviews.
                  </p>
                </div>
              </div>

              <div className="durations-interactive-grid">
                {domain.availableDurations?.map((dur) => {
                  const isSelected = dur._id === selectedDuration?._id;
                  return (
                    <motion.div
                      key={dur._id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        endDateEdited.current = false;
                        setDurationId(dur._id);
                      }}
                      className={`duration-interactive-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="duration-card-top">
                        <div className="duration-title-group">
                          <div className={`radio-dot-indicator ${isSelected ? "active" : ""}`}>
                            {isSelected && <div className="inner-dot" />}
                          </div>
                          <div>
                            <span className="duration-title-text">
                              {dur.label || `${dur.weeks} Weeks Track`}
                            </span>
                            <span className="duration-weeks-sub">{dur.weeks} Weeks Self-Paced</span>
                          </div>
                        </div>
                        <div className="duration-fee-pill">
                          ₹{dur.fee}
                        </div>
                      </div>
                      <div className="duration-card-features">
                        <span className="dur-feat-item">
                          <Check size={12} color="#059669" />
                          <span>Weekly Capstone Tasks</span>
                        </span>
                        <span className="dur-feat-item">
                          <Check size={12} color="#059669" />
                          <span>Verified Selection Offer</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Step 2: Internship Dates Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel apply-section-card"
            >
              <div className="section-card-header">
                <div className="step-badge">2</div>
                <div>
                  <h2 className="section-card-title">Internship Schedule &amp; Dates</h2>
                  <p className="section-card-subtitle">
                    Select when your internship starts. The end date is automatically calculated for you.
                  </p>
                </div>
              </div>

              <div className="date-fields-wrapper">
                <div className="date-input-box">
                  <label htmlFor="start-date" className="date-box-label">
                    <CalendarDays size={15} color="#4f46e5" />
                    <span>Starting Date</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="custom-date-field"
                    value={startDate}
                    min={getTodayInputValue()}
                    onChange={(e) => {
                      endDateEdited.current = false;
                      setStartDate(e.target.value);
                    }}
                    required
                  />
                  <span className="date-helper">Select your preferred start day</span>
                </div>

                <div className="date-input-box">
                  <label htmlFor="end-date" className="date-box-label">
                    <CalendarDays size={15} color="#0284c7" />
                    <span>Estimated Completion Date</span>
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="custom-date-field"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => {
                      endDateEdited.current = true;
                      setEndDate(e.target.value);
                    }}
                    required
                  />
                  <span className="date-helper">Calculated from your {selectedDuration?.weeks || 4}-week track</span>
                </div>
              </div>

              <div className="schedule-flexibility-notice">
                <Zap size={15} color="#d97706" />
                <span>
                  <strong>Flexible &amp; Self-Paced:</strong> You can submit your milestone capstones ahead of schedule or at your own pace within the designated window.
                </span>
              </div>
            </motion.div>

            {/* Step 3: Academic & Candidate Credentials */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel apply-section-card"
            >
              <div className="section-card-header">
                <div className="step-badge">3</div>
                <div>
                  <h2 className="section-card-title">Academic &amp; Student Information</h2>
                  <p className="section-card-subtitle">
                    Confirm your details to be inscribed on your verified credentials.
                  </p>
                </div>
              </div>

              <div className="candidate-details-grid">
                <div className="candidate-info-chip">
                  <User size={15} color="#64748b" />
                  <div>
                    <span className="info-chip-label">Candidate Name</span>
                    <strong className="info-chip-val">{savedUser.fullName || "Registered Student"}</strong>
                  </div>
                  <span className="verified-pill">Verified ✓</span>
                </div>

                <div className="candidate-info-chip">
                  <Mail size={15} color="#64748b" />
                  <div>
                    <span className="info-chip-label">Verified Email</span>
                    <strong className="info-chip-val">{savedUser.email || "Registered Email"}</strong>
                  </div>
                  <span className="verified-pill">Verified ✓</span>
                </div>
              </div>

              <div className="input-group" style={{ marginTop: "1.25rem" }}>
                <label className="input-label" htmlFor="college-name">
                  <GraduationCap size={16} className="inline-icon" />
                  <span>College / University / Institution Name</span>
                </label>
                <input
                  id="college-name"
                  type="text"
                  className="input-field styled-text-field"
                  placeholder="e.g. Delhi Technological University / Amity / IIT / SRM"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                />
                <span className="field-subtext">
                  Printed on your official Offer Letter and cryptographically verified Completion Certificate.
                </span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Sticky Summary & Deliverables Sidebar */}
          <div className="apply-sidebar-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-panel sticky-summary-card"
            >
              <div className="summary-card-header">
                <div className="seal-badge">
                  <Award size={18} color="#4f46e5" />
                  <span>Official Selection Record</span>
                </div>
                <span className="live-status-pill">
                  <span className="pulse-dot" /> Instant Approval
                </span>
              </div>

              <div className="summary-track-hero">
                <span className="summary-category-tag">{domain.category}</span>
                <h3 className="summary-domain-name">{domain.name}</h3>
                <div className="summary-duration-tag">
                  <Clock size={14} />
                  <span>{selectedDuration?.label || `${selectedDuration?.weeks} Weeks Track`}</span>
                </div>
              </div>

              <div className="summary-breakdown-box">
                <div className="breakdown-row">
                  <span>Start Date:</span>
                  <strong>{formatDisplayDate(startDate)}</strong>
                </div>
                <div className="breakdown-row">
                  <span>End Date:</span>
                  <strong>{formatDisplayDate(endDate)}</strong>
                </div>
                <div className="breakdown-row">
                  <span>Track Duration:</span>
                  <strong>{selectedDuration?.weeks} Weeks ({selectedDuration?.weeks * 7} Days)</strong>
                </div>
                <div className="breakdown-divider" />
                <div className="breakdown-row fee-highlight-row">
                  <div>
                    <span className="fee-row-label">Total Program Fee</span>
                    <span className="fee-tax-sub">All inclusive • No hidden charges</span>
                  </div>
                  <strong className="summary-total-fee">₹{selectedDuration?.fee}</strong>
                </div>
              </div>

              {/* What You Will Receive */}
              <div className="summary-deliverables-section">
                <span className="deliverables-heading">Official Inclusions:</span>
                <ul className="deliverables-checklist">
                  <li>
                    <CheckCircle2 size={15} color="#059669" className="check-icon" />
                    <span>Instant Verified Offer Letter (PDF + Verification URL)</span>
                  </li>
                  <li>
                    <CheckCircle2 size={15} color="#059669" className="check-icon" />
                    <span>Cryptographically Verified Certificate with QR validation</span>
                  </li>
                  <li>
                    <CheckCircle2 size={15} color="#059669" className="check-icon" />
                    <span>Weekly Practical Capstone Project Milestones</span>
                  </li>
                  <li>
                    <CheckCircle2 size={15} color="#059669" className="check-icon" />
                    <span>Mentor Code Reviews &amp; Feedback</span>
                  </li>
                  <li>
                    <CheckCircle2 size={15} color="#059669" className="check-icon" />
                    <span>Official Selected Interns WhatsApp Community Hub</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="error-message-box">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn btn-primary btn-glow full-width btn-apply-submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "Generating Selection Record..."
                    : `Confirm & Generate Selection Letter (₹${selectedDuration?.fee || 0})`}
                </span>
                <ArrowRight size={18} />
              </motion.button>

              <div className="security-trust-footer">
                <div className="trust-item">
                  <Lock size={12} color="#64748b" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="trust-item">
                  <ShieldCheck size={12} color="#059669" />
                  <span>Recruiter Verifiable</span>
                </div>
              </div>
            </motion.div>
          </div>
        </form>
      </div>

      <style>{`
        .apply-page-wrapper {
          padding: 3rem 0 5rem 0;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: calc(100vh - 120px);
        }
        .apply-top-nav {
          margin-bottom: 1.25rem;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #475569 !important;
          font-size: 0.925rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .back-link:hover {
          color: #4f46e5 !important;
          transform: translateX(-3px);
        }
        .apply-header-banner {
          margin-bottom: 2.25rem;
        }
        .apply-page-title {
          font-size: 2.4rem;
          font-weight: 900;
          color: #0f172a !important;
          letter-spacing: -0.03em;
          margin: 0.65rem 0 0.4rem 0;
        }
        .apply-page-desc {
          font-size: 1.05rem;
          color: #475569 !important;
          max-width: 720px;
          line-height: 1.55;
        }
        .apply-split-layout {
          display: grid;
          grid-template-columns: 1fr 430px;
          gap: 2.5rem;
          align-items: flex-start;
        }
        .apply-form-main-col {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .apply-section-card {
          padding: 2.25rem;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 15px rgba(15, 23, 42, 0.03);
        }
        .section-card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 1.25rem;
        }
        .step-badge {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent-purple));
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.95rem;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
        }
        .section-card-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0 0 0.25rem 0;
        }
        .section-card-subtitle {
          font-size: 0.88rem;
          color: #64748b !important;
          margin: 0;
        }
        .durations-interactive-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .duration-interactive-card {
          padding: 1.25rem;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .duration-interactive-card:hover {
          border-color: #818cf8;
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.08);
        }
        .duration-interactive-card.selected {
          border-color: #4f46e5;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15), 0 8px 20px rgba(79, 70, 229, 0.1);
        }
        .duration-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .duration-title-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .radio-dot-indicator {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .radio-dot-indicator.active {
          border-color: #4f46e5;
        }
        .inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4f46e5;
        }
        .duration-title-text {
          font-size: 0.98rem;
          font-weight: 800;
          color: #0f172a;
          display: block;
        }
        .duration-weeks-sub {
          font-size: 0.75rem;
          color: #64748b;
          display: block;
        }
        .duration-fee-pill {
          font-size: 1.15rem;
          font-weight: 900;
          color: #4f46e5;
          background: rgba(79, 70, 229, 0.08);
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
        }
        .duration-card-features {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding-top: 0.75rem;
          border-top: 1px dashed #e2e8f0;
        }
        .dur-feat-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.76rem;
          color: #475569;
          font-weight: 500;
        }
        .date-fields-wrapper {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        .date-input-box {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .date-box-label {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
        }
        .custom-date-field {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1.5px solid #cbd5e1;
          border-radius: var(--radius-sm);
          font-size: 0.95rem;
          font-weight: 600;
          color: #0f172a;
          background: #ffffff;
          transition: all 0.2s;
        }
        .custom-date-field:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
          outline: none;
        }
        .date-helper {
          font-size: 0.76rem;
          color: #64748b;
        }
        .schedule-flexibility-notice {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 0.85rem 1.15rem;
          border-radius: var(--radius-sm);
          margin-top: 1.25rem;
          font-size: 0.84rem;
          color: #92400e;
          line-height: 1.45;
        }
        .candidate-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .candidate-info-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          position: relative;
        }
        .info-chip-label {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
        }
        .info-chip-val {
          display: block;
          font-size: 0.9rem;
          color: #0f172a;
          word-break: break-all;
        }
        .verified-pill {
          margin-left: auto;
          font-size: 0.7rem;
          font-weight: 700;
          color: #059669;
          background: rgba(5, 150, 105, 0.08);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }
        .inline-icon {
          vertical-align: middle;
          margin-right: 0.35rem;
          color: #4f46e5;
        }
        .styled-text-field {
          width: 100%;
          padding: 0.85rem 1rem;
          font-size: 0.95rem;
          border: 1.5px solid #cbd5e1;
          border-radius: var(--radius-sm);
        }
        .styled-text-field:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        .apply-sidebar-col {
          position: sticky;
          top: 96px;
        }
        .sticky-summary-card {
          padding: 2.25rem;
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          border-radius: var(--radius-md);
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .summary-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.85rem;
        }
        .seal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 800;
          color: #4f46e5;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #059669;
          background: rgba(5, 150, 105, 0.08);
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
        }
        .summary-track-hero {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .summary-category-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284c7;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .summary-domain-name {
          font-size: 1.45rem;
          font-weight: 900;
          color: #0f172a !important;
          margin: 0;
          line-height: 1.25;
        }
        .summary-duration-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.825rem;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          align-self: flex-start;
          margin-top: 0.25rem;
        }
        .summary-breakdown-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .breakdown-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #475569;
        }
        .breakdown-row strong {
          color: #0f172a;
        }
        .breakdown-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 0.35rem 0;
        }
        .fee-highlight-row {
          align-items: center;
        }
        .fee-row-label {
          display: block;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
        }
        .fee-tax-sub {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
        }
        .summary-total-fee {
          font-size: 1.85rem;
          font-weight: 900;
          color: #4f46e5;
        }
        .summary-deliverables-section {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .deliverables-heading {
          font-size: 0.78rem;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .deliverables-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .deliverables-checklist li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.825rem;
          color: #334155;
          line-height: 1.4;
        }
        .check-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .btn-apply-submit {
          padding: 1.05rem 1.5rem;
          font-size: 1.02rem;
          font-weight: 800;
          border-radius: var(--radius-sm);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
        }
        .security-trust-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding-top: 0.4rem;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 600;
        }
        .error-message-box {
          padding: 0.85rem 1rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #dc2626;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }
        @media (max-width: 992px) {
          .apply-split-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .apply-sidebar-col {
            position: static;
          }
        }
        @media (max-width: 600px) {
          .apply-section-card {
            padding: 1.5rem 1.15rem;
          }
          .date-fields-wrapper {
            grid-template-columns: 1fr;
          }
          .candidate-details-grid {
            grid-template-columns: 1fr;
          }
          .durations-interactive-grid {
            grid-template-columns: 1fr;
          }
          .apply-page-title {
            font-size: 1.85rem;
          }
          .sticky-summary-card {
            padding: 1.5rem 1.15rem;
          }
        }
      `}</style>
    </div>
  );
}
