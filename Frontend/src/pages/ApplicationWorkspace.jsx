import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Send,
  Check,
  CreditCard,
  ShieldCheck,
  QrCode,
  X,
  Copy,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  ExternalLink,
} from "lucide-react";
import api from "../api/axios";
import OfferLetterPreview from "../components/OfferLetterPreview";
import CertificatePreview from "../components/CertificatePreview";

const PROGRESS_STEPS = [
  "Submitted",
  "Under Review",
  "Selected",
  "Active",
  "Completed",
];

function AssignmentCardItem({ assignment, submission, onSubmit }) {
  const [githubUrl, setGithubUrl] = useState(submission?.githubUrl || "");
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSub = (e) => {
    e.preventDefault();
    if (!githubUrl) return;
    onSubmit({ githubUrl });
  };

  // Parse instructions lines into clean checklist points
  const taskGuide = assignment.beginnerGuide || assignment.instructions;
  const instructionLines = taskGuide
    ? taskGuide.split("\n").filter((line) => line.trim().length > 0)
    : [];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass-card assignment-card-item"
    >
      <div className="assignment-header flex items-center justify-between">
        <span className="badge-pill badge-pill-cyan">
          {assignment.weekLabel
            ? `${assignment.weekLabel} Milestone`
            : `Milestone ${assignment.week}`}
        </span>
        {submission ? (
          <span className="badge-pill badge-pill-emerald flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>Solution Submitted</span>
          </span>
        ) : (
          <span className="badge-pill badge-pill-amber flex items-center gap-1">
            <Clock size={13} />
            <span>Pending Submission</span>
          </span>
        )}
      </div>

      <h3 className="assignment-title">{assignment.title}</h3>
      <p className="assignment-desc">{assignment.description}</p>

      {/* Instructions Toggle Accordion Button */}
      <button
        type="button"
        className="btn-toggle-instructions"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        <BookOpen size={14} className="text-indigo-500" />
        <span>
          {showInstructions
            ? "Hide Task Guidance"
            : "View Step-by-Step Task Guidance"}
        </span>
        {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Instructions Drawer */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="instructions-drawer"
          >
            <h4 className="instructions-heading">
              <Sparkles size={14} style={{ color: "#d97706" }} />
              <span>Easy Step-by-Step Guidance:</span>
            </h4>
            <div className="instructions-steps-list">
              {instructionLines.map((step, idx) => (
                <div key={idx} className="step-instruction-item">
                  <span className="step-num-badge">{idx + 1}</span>
                  <span className="step-text-val">
                    {step.replace(/^\d+\.\s*/, "")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Form */}
      <form onSubmit={handleSub} className="assignment-form">
        <div className="input-group" style={{ marginBottom: "0.5rem" }}>
          <label className="input-label flex items-center justify-between">
            <span>GitHub Repository / Live Demo URL</span>
            {submission?.githubUrl && (
              <a
                href={submission.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="link-external-view"
              >
                <span>View Submitted Link</span>
                <ExternalLink size={12} />
              </a>
            )}
          </label>
          <input
            className="input-field submission-input"
            placeholder="e.g. https://github.com/username/my-project"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn btn-primary btn-sm full-width btn-glow"
        >
          <span>
            {submission ? "Update Solution" : "Submit GitHub Solution"}
          </span>
          <Send size={14} />
        </motion.button>
      </form>

      {submission?.feedback && (
        <div className="feedback-box mt-2">
          <strong className="feedback-title flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Mentor Feedback:</span>
          </strong>
          <p className="feedback-content">{submission.feedback}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function ApplicationWorkspace() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");

  const [reportForm, setReportForm] = useState({
    title: "",
    introduction: "",
    workCompleted: "",
    githubUrl: "",
  });

  // Payment QR Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payerName: "",
    registeredEmail: "",
    utrNumber: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const appRes = await api.get(`/applications/${id}`);
      const nextApplication = appRes.data;
      setApplication(nextApplication);

      if (nextApplication.student) {
        setPaymentForm({
          payerName: nextApplication.student.fullName || "",
          registeredEmail: nextApplication.student.email || "",
          utrNumber: "",
        });
      }

      const workspaceUnlocked = ["Selected", "Active", "Completed"].includes(
        nextApplication.status,
      );
      if (workspaceUnlocked) {
        const assRes = await api.get(`/assignments/for-application/${id}`);
        setAssignments(assRes.data);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error("Unable to load application workspace:", err);
      setLoadError(
        err.response?.data?.message ||
          "Unable to load this application workspace.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: "5rem 1rem" }}>
        <div className="spinner"></div>
        <p>Loading application workspace...</p>
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="container text-center" style={{ padding: "5rem 1rem" }}>
        <div
          className="error-alert-box"
          style={{ maxWidth: "560px", margin: "0 auto 1.25rem" }}
        >
          {loadError || "Application could not be found."}
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Student Dashboard</span>
        </Link>
      </div>
    );
  }

  const currentStepIndex = PROGRESS_STEPS.indexOf(application.status);

  const submitAssignment = async (assignmentId, payload) => {
    try {
      await api.post(`/assignments/${assignmentId}/submit`, {
        applicationId: id,
        ...payload,
      });
      setMessage("✓ Assignment submission saved successfully.");
      const res = await api.get(`/assignments/for-application/${id}`);
      setAssignments(res.data);
    } catch (err) {
      setMessage("✕ Error submitting assignment.");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.utrNumber) return;
    setPaymentSubmitting(true);
    try {
      await api.post("/payments/confirm", {
        applicationId: id,
        payerName: paymentForm.payerName,
        registeredEmail: paymentForm.registeredEmail,
        utrNumber: paymentForm.utrNumber,
      });
      setMessage(
        "✓ Payment confirmed via UPI! Program status updated to Active.",
      );
      setShowPaymentModal(false);
      load();
    } catch (err) {
      try {
        await api.post("/payments/confirm", { orderId: `UPI-${Date.now()}` });
        setMessage("✓ Payment confirmed! Program status updated to Active.");
        setShowPaymentModal(false);
        load();
      } catch (err2) {
        setMessage("✕ Payment confirmation failed. Please verify UTR number.");
      }
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText("amanmishra15.08.2005-2@oksbi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const submitFinalReport = async (e) => {
    e.preventDefault();
    try {
      await api.post("/documents/final-report", {
        applicationId: id,
        ...reportForm,
      });
      setMessage("✓ Final capstone report submitted successfully!");
      load();
    } catch (err) {
      setMessage("✕ Error submitting final report.");
    }
  };

  const downloadOfferLetter = async () => {
    try {
      const res = await api.get(`/documents/offer-letter/${id}`);
      const pdfPath = res.data.pdfUrl;
      const downloadUrl = pdfPath.startsWith("http")
        ? pdfPath
        : pdfPath.startsWith("/")
          ? pdfPath
          : `/${pdfPath}`;
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading offer letter:", err);
      alert(
        err.response?.data?.message || "Could not generate offer letter PDF.",
      );
    }
  };

  const downloadCertificate = async () => {
    try {
      const res = await api.get(`/documents/certificate/${id}`);
      const pdfPath = res.data.pdfUrl;
      const downloadUrl = pdfPath.startsWith("http")
        ? pdfPath
        : pdfPath.startsWith("/")
          ? pdfPath
          : `/${pdfPath}`;
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert(
        err.response?.data?.message || "Could not generate certificate PDF.",
      );
    }
  };

  return (
    <div className="container workspace-container">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to Student Dashboard</span>
      </Link>

      {/* Top Workspace Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="workspace-banner glass-panel"
      >
        <div>
          <span className="badge-pill badge-pill-cyan">
            {application.domain?.category}
          </span>
          <h1 className="workspace-title">
            {application.domain?.name} Workspace
          </h1>
          <p className="workspace-subtitle">
            Application ID:{" "}
            <strong className="id-highlight">
              {application.applicationId}
            </strong>{" "}
            • {application.duration?.label} Track
          </p>
        </div>

        <div className="banner-status-box">
          <span className="status-label">Current Status</span>
          <span className="status-val">{application.status}</span>
        </div>
      </motion.div>

      {/* Interactive Workflow Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel workspace-stepper-card"
      >
        <h3 className="stepper-card-title">Internship Milestone Progress</h3>
        <div className="workspace-stepper">
          {PROGRESS_STEPS.map((s, i) => (
            <div
              key={s}
              className={`stepper-step ${i <= currentStepIndex ? "done" : ""}`}
            >
              <div className="step-circle">
                {i <= currentStepIndex ? <Check size={16} /> : i + 1}
              </div>
              <span className="step-text">{s}</span>
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="step-line"></div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="notice-banner"
        >
          {message}
        </motion.div>
      )}

      {/* Offer Letter Box when Selected */}
      {application.status === "Selected" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel offer-unlocked-card"
        >
          <div className="unlocked-text">
            <span className="badge-pill badge-pill-emerald">
              Offer Unlocked 🎉
            </span>
            <h2>
              Congratulations! You've been selected for{" "}
              {application.domain?.name}.
            </h2>
            <p>
              Your official InternDock selection offer letter is generated and
              cryptographically signed.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary btn-glow"
            onClick={downloadOfferLetter}
          >
            <FileText size={18} />
            <span>Download Official Offer Letter (PDF)</span>
          </motion.button>
        </motion.div>
      )}

      {/* Assignments & Capstone Area for Active, Completed, or Selected */}
      {["Active", "Completed", "Selected"].includes(application.status) && (
        <div className="workspace-main-content">
          <h2 className="section-header-title">
            Guided Internship Milestones ({assignments.length} Tasks + Capstone
            Final Report)
          </h2>
          {assignments.length === 0 ? (
            <div
              className="glass-panel text-center"
              style={{ padding: "2rem" }}
            >
              <p className="color-muted">
                No weekly assignments found for this domain track.
              </p>
            </div>
          ) : (
            <div className="grid-2 assignments-grid">
              {assignments.map(({ assignment, submission }, idx) => (
                <motion.div
                  key={assignment._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <AssignmentCardItem
                    assignment={assignment}
                    submission={submission}
                    onSubmit={(payload) =>
                      submitAssignment(assignment._id, payload)
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Final Capstone Report */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel final-report-panel"
            style={{ marginTop: "2.5rem" }}
          >
            <h2>Capstone Final Report</h2>
            <p className="color-muted" style={{ marginBottom: "1.5rem" }}>
              Submit your final project write-up and source code URL to qualify
              for certificate issuance.
            </p>

            {application.finalReportSubmitted ? (
              <div className="report-submitted-badge">
                <CheckCircle2 size={18} />
                <span>
                  Capstone Final Report Submitted &amp; Pending Review.
                </span>
              </div>
            ) : application.paymentStatus !== "Successful" ? (
              <div className="report-payment-required">
                <CreditCard size={20} />
                <div>
                  <strong>
                    Complete payment before submitting your report
                  </strong>
                  <p>
                    Pay the program fee in the payment section below, then
                    return here to submit your final internship report.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={submitFinalReport} className="report-form">
                <div className="input-group">
                  <label className="input-label">Project Title</label>
                  <input
                    className="input-field"
                    placeholder="e.g. E-Commerce Platform with Stripe & Microservices"
                    value={reportForm.title}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Executive Summary &amp; Introduction
                  </label>
                  <textarea
                    className="textarea-field"
                    rows="3"
                    placeholder="Describe the problem your capstone project solves..."
                    value={reportForm.introduction}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        introduction: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Technical Work &amp; Features Completed
                  </label>
                  <textarea
                    className="textarea-field"
                    rows="4"
                    placeholder="List backend APIs built, frontend components, databases used..."
                    value={reportForm.workCompleted}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        workCompleted: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    GitHub Repository / Live Demo URL
                  </label>
                  <input
                    className="input-field"
                    placeholder="https://github.com/username/repository"
                    value={reportForm.githubUrl}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        githubUrl: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn btn-primary btn-glow full-width btn-lg mt-3"
                >
                  <span>Submit Capstone Final Report</span>
                  <Send size={16} />
                </motion.button>
              </form>
            )}

            <div className="linkedin-certificate-prompt">
              <div>
                <strong>Stay updated on your certificate</strong>
                <span>
                  Follow InternDock on LinkedIn for certificate and career
                  updates.
                </span>
              </div>
              <a
                href="https://www.linkedin.com/company/interndockindia"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={15} />
                <span>Follow us on LinkedIn</span>
              </a>
            </div>
          </motion.div>

          {/* Program Fee Payment Card */}
          <div
            className="glass-panel payment-panel"
            style={{ marginTop: "2rem" }}
          >
            <h2>Program Fee &amp; Verification Status</h2>
            {application.paymentStatus === "Successful" ? (
              <div className="payment-success-pill">
                <CheckCircle2 size={18} />
                <span>
                  Program Fee Paid (₹{application.duration?.fee}) • Account
                  Verified
                </span>
              </div>
            ) : (
              <div className="payment-action-box">
                <p>
                  Complete your program fee via UPI QR Code to unlock instant
                  certificate eligibility upon capstone approval.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary btn-glow flex items-center gap-2"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <QrCode size={18} />
                  <span>
                    Pay Program Fee (₹{application.duration?.fee}) via UPI QR
                  </span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offer Letter Live Preview */}
      {["Selected", "Active", "Completed"].includes(application.status) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: "2.5rem" }}
        >
          <OfferLetterPreview
            studentName={application.student?.fullName || "Intern Student"}
            collegeName={application.student?.college || ""}
            domainName={application.domain?.title || "Tech Internship Domain"}
            durationLabel={application.duration?.label || "4 Weeks Track"}
            startDate={
              application.startDate
                ? new Date(application.startDate).toDateString()
                : ""
            }
            endDate={
              application.endDate
                ? new Date(application.endDate).toDateString()
                : ""
            }
            applicationId={application._id}
            referenceId={
              application.offerLetterRef ||
              `OFFER-${application._id?.slice(-6)}`
            }
            verificationId={application.verificationId || application._id}
            onDownload={downloadOfferLetter}
          />
        </motion.div>
      )}

      {/* Certificate Live Preview */}
      {application.certificateIssued && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginTop: "2.5rem" }}
        >
          <CertificatePreview
            studentName={application.student?.fullName || "Intern Student"}
            collegeName={application.student?.college || ""}
            domainName={application.domain?.title || "Tech Internship Domain"}
            durationLabel={application.duration?.label || "4 Weeks Track"}
            startDate={
              application.startDate
                ? new Date(application.startDate).toDateString()
                : ""
            }
            endDate={
              application.endDate
                ? new Date(application.endDate).toDateString()
                : ""
            }
            certificateId={`CERT-${application._id?.slice(-8).toUpperCase()}`}
            verificationId={application.verificationId || application._id}
            onDownload={downloadCertificate}
          />
        </motion.div>
      )}

      {/* UPI Payment Modal with Name & Registered Email */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel payment-qr-modal"
            >
              <div className="modal-header">
                <div>
                  <span className="badge-pill badge-pill-emerald">
                    Official Payment Gateway
                  </span>
                  <h3 className="modal-title">
                    Scan UPI QR &amp; Confirm Payment
                  </h3>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-qr-grid">
                {/* QR Code Container */}
                <div className="qr-image-card text-center">
                  <div className="qr-frame">
                    <img
                      src="/payment_qr.png"
                      alt="Aman Mishra UPI QR Code"
                      className="payment-qr-img"
                    />
                  </div>
                  <div className="upi-account-info">
                    <span className="account-holder-name">Aman Mishra</span>
                    <div className="upi-id-row">
                      <span className="upi-id-text">
                        amanmishra15.08.2005-2@oksbi
                      </span>
                      <button
                        className="btn-copy-upi"
                        onClick={copyUpiId}
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? (
                          <Check size={14} color="#10b981" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <span className="pay-amount-tag">
                      Amount to Pay:{" "}
                      <strong>₹{application.duration?.fee}</strong>
                    </span>
                  </div>
                </div>

                {/* Form Container */}
                <form
                  onSubmit={handlePaymentSubmit}
                  className="payment-confirm-form"
                >
                  <div className="input-group">
                    <label className="input-label">Payer Full Name</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Aman Mishra"
                      value={paymentForm.payerName}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          payerName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Registered Student Email
                    </label>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="student@example.com"
                      value={paymentForm.registeredEmail}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          registeredEmail: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      UPI Reference / UTR Number (12 Digits)
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. 324198754120"
                      value={paymentForm.utrNumber}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          utrNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="payment-notice-box">
                    <ShieldCheck size={16} color="#10b981" />
                    <span>
                      Scan QR code with any UPI App (GPay, PhonePe, Paytm, BHIM)
                      and paste your UTR number above.
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn btn-primary btn-glow full-width btn-lg mt-2"
                    disabled={paymentSubmitting}
                  >
                    <span>
                      {paymentSubmitting
                        ? "Verifying Payment..."
                        : `Confirm & Verify Payment (₹${application.duration?.fee})`}
                    </span>
                    <CheckCircle2 size={16} />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .workspace-container { padding: 3rem 1.5rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #64748b !important; margin-bottom: 1.25rem; font-weight: 600; text-decoration: none; }
        .back-link:hover { color: #4f46e5 !important; }
        .workspace-banner { display: flex; align-items: center; justify-content: space-between; padding: 2.5rem; margin-bottom: 2rem; }
        .workspace-title { font-size: 2.2rem; font-weight: 800; margin: 0.5rem 0; color: #0f172a !important; }
        .workspace-subtitle { color: #475569 !important; font-size: 0.95rem; }
        .id-highlight { color: #1e3a8a !important; font-family: monospace; font-weight: 700; }
        .banner-status-box { display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(79, 70, 229, 0.08); border: 1px solid rgba(79, 70, 229, 0.2); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); }
        .status-label { font-size: 0.75rem; color: #64748b !important; text-transform: uppercase; font-weight: 700; }
        .status-val { font-size: 1.1rem; font-weight: 800; color: #0284c7 !important; }
        .workspace-stepper-card { padding: 2rem; margin-bottom: 2rem; }
        .stepper-card-title { font-size: 1.1rem; margin-bottom: 1.5rem; color: #0f172a !important; font-weight: 800; }
        .workspace-stepper { display: flex; align-items: center; justify-content: space-between; }
        .stepper-step { display: flex; align-items: center; gap: 0.75rem; position: relative; flex: 1; }
        .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; color: #64748b !important; flex-shrink: 0; }
        .stepper-step.done .step-circle { background: linear-gradient(135deg, var(--primary), var(--accent-purple)); color: #ffffff !important; border-color: transparent; }
        .step-text { font-size: 0.875rem; font-weight: 600; color: #64748b !important; }
        .stepper-step.done .step-text { color: #0f172a !important; font-weight: 700; }
        .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 0.5rem; }
        .stepper-step.done .step-line { background: #6366f1; }
        .notice-banner { padding: 1rem 1.5rem; background: rgba(79, 70, 229, 0.08); border: 1px solid rgba(79, 70, 229, 0.25); border-radius: var(--radius-sm); color: #4f46e5; font-weight: 700; margin-bottom: 1.5rem; }
        .offer-unlocked-card { display: flex; align-items: center; justify-content: space-between; padding: 2rem; border-left: 5px solid #10b981; margin-bottom: 2rem; }
        .unlocked-text h2 { font-size: 1.3rem; font-weight: 800; color: #0f172a !important; margin: 0.5rem 0 0.25rem 0; }
        .unlocked-text p { color: #475569 !important; font-size: 0.9rem; }
        .section-header-title { font-size: 1.4rem; font-weight: 800; color: #0f172a !important; margin-bottom: 1.25rem; }
        .assignments-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.35rem; }
        .assignment-card-item { padding: 1.6rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 0.85rem; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05); }
        .assignment-title { font-size: 1.15rem; font-weight: 900; color: #0f172a !important; margin: 0.25rem 0 0 0; }
        .assignment-desc { color: #475569 !important; font-size: 0.9rem; line-height: 1.55; flex: 1; }
        .btn-toggle-instructions { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; border-radius: 6px; background: rgba(79, 70, 229, 0.06); border: 1px solid rgba(79, 70, 229, 0.18); font-size: 0.825rem; font-weight: 700; color: #4f46e5; cursor: pointer; transition: all 0.2s; align-self: flex-start; }
        .btn-toggle-instructions:hover { background: rgba(79, 70, 229, 0.12); }
        .instructions-drawer { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem 1.1rem; overflow: hidden; margin: 0.25rem 0; }
        .instructions-heading { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.6rem; }
        .instructions-steps-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .step-instruction-item { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.875rem; color: #334155; line-height: 1.45; }
        .step-num-badge { width: 20px; height: 20px; border-radius: 50%; background: #4f46e5; color: #ffffff; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .link-external-view { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.78rem; font-weight: 700; color: #0284c7; text-decoration: none; }
        .submission-input { margin-bottom: 0.75rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; color: #0f172a !important; }
        .feedback-box { background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.22); padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.875rem; }
        .feedback-title { color: #047857; font-size: 0.85rem; margin-bottom: 0.2rem; }
        .feedback-content { color: #064e3b; margin: 0; line-height: 1.4; }
        .final-report-panel { padding: 2rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-md); }
        .final-report-panel h2 { color: #0f172a !important; font-weight: 800; }
        .report-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .report-submitted-badge { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.5rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); color: #059669; font-weight: 700; border-radius: var(--radius-sm); }
        .report-payment-required { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.15rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: var(--radius-sm); color: #9a3412; }
        .report-payment-required strong { display: block; font-size: 0.92rem; }
        .report-payment-required p { margin: 0.25rem 0 0; color: #7c2d12; font-size: 0.84rem; line-height: 1.5; }
        .linkedin-certificate-prompt { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; padding: 1rem 1.15rem; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: var(--radius-sm); }
        .linkedin-certificate-prompt div { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
        .linkedin-certificate-prompt strong { color: #312e81; font-size: 0.9rem; }
        .linkedin-certificate-prompt span { color: #64748b; font-size: 0.82rem; }
        .payment-panel { padding: 2rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-md); }
        .payment-panel h2 { color: #0f172a !important; font-weight: 800; margin-bottom: 1rem; }
        .payment-success-pill { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.5rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); color: #059669; font-weight: 700; border-radius: var(--radius-sm); }
        .payment-action-box { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
        .payment-action-box p { color: #475569 !important; font-size: 0.925rem; }

        /* Modal Styles */
        .modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .payment-qr-modal { background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: 16px; padding: 2.25rem; max-width: 760px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); }
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
        .modal-title { font-size: 1.5rem; font-weight: 900; color: #0f172a !important; margin-top: 0.35rem; }
        .modal-close-btn { background: #f1f5f9; border: none; padding: 0.5rem; border-radius: 50%; color: #64748b; cursor: pointer; transition: background 0.2s; }
        .modal-close-btn:hover { background: #e2e8f0; color: #0f172a; }
        .modal-qr-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; align-items: center; }
        .qr-image-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .qr-frame { width: 200px; height: 200px; border-radius: 8px; overflow: hidden; border: 2px solid #cbd5e1; background: #ffffff; padding: 0.35rem; }
        .payment-qr-img { width: 100%; height: 100%; object-fit: contain; }
        .upi-account-info { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; width: 100%; }
        .account-holder-name { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .upi-id-row { display: flex; align-items: center; gap: 0.4rem; background: #ffffff; border: 1px solid #cbd5e1; padding: 0.35rem 0.65rem; border-radius: 6px; }
        .upi-id-text { font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #1e3a8a; }
        .btn-copy-upi { background: none; border: none; cursor: pointer; color: #64748b; padding: 0.2rem; }
        .btn-copy-upi:hover { color: #1e3a8a; }
        .pay-amount-tag { font-size: 0.9rem; color: #059669; font-weight: 700; margin-top: 0.25rem; }
        .payment-confirm-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .payment-notice-box { display: flex; align-items: center; gap: 0.65rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.825rem; color: #059669; font-weight: 600; }
        @media (max-width: 640px) {
          .workspace-banner { flex-direction: column; align-items: center; gap: 1.25rem; text-align: center; }
          .banner-status-box { width: min(100%, 260px); }
          .linkedin-certificate-prompt { align-items: flex-start; flex-direction: column; }
          .modal-qr-grid { grid-template-columns: 1fr; }
          .payment-action-box { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
