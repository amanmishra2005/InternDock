import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  Search,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
  QrCode,
} from "lucide-react";
import axios from "axios";
import confetti from "canvas-confetti";
import CertificatePreview from "../components/CertificatePreview";

export default function VerifyCertificate() {
  const { id } = useParams();
  const [searchId, setSearchId] = useState(id && id !== "sample" ? id : "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyCert = async (verificationId) => {
    if (!verificationId || verificationId === "sample") return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.get(
        `/api/documents/verify/certificate/${verificationId}`,
      );
      setResult(data);
      if (data.valid) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid or unverified certificate ID",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && id !== "sample") {
      verifyCert(id);
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCert(searchId);
  };

  return (
    <div className="verify-page">
      <div className="verify-bg-mesh" aria-hidden="true" />
      <div className="container verify-container">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="verify-eyebrow text-center"
        >
          <span className="badge-pill badge-pill-amber">
            <Sparkles size={14} />
            <span>Cryptographically Signed Credential</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="verify-card glass-panel"
        >
          <div className="verify-header text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="verify-icon-badge gold-glow"
            >
              <Award size={30} />
            </motion.div>
            <h1 className="verify-title">Certificate Verification</h1>
            <p className="verify-subtitle">
              Authenticate official InternDock completion &amp; merit
              certificates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="verify-form">
            <div className="input-group">
              <label className="input-label">
                Enter Certificate Verification ID
              </label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. INT-CERT-2026-XXXXX"
                  className="input-field"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="btn btn-primary btn-glow"
                  disabled={loading}
                >
                  <span>{loading ? "Verifying..." : "Verify Credential"}</span>
                  <Search size={16} />
                </motion.button>
              </div>
              <span className="verify-hint">
                Find this ID at the bottom of your certificate PDF, or in the QR
                code.
              </span>
            </div>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="verify-status-banner banner-error"
            >
              <span className="status-icon icon-error">
                <X size={18} />
              </span>
              <div>
                <strong>Verification Failed</strong>
                <p>{error}</p>
              </div>
            </motion.div>
          )}

          {result && result.valid && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="verify-status-banner banner-success"
            >
              <span className="status-icon icon-success">
                <Check size={18} />
              </span>
              <div className="success-content">
                <h3>Verified Authentic Certificate</h3>
                <p className="meta-text">
                  This certificate of completion was earned &amp; verified by
                  InternDock.
                </p>

                <div className="doc-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Recipient Name</span>
                    <span className="detail-val">
                      {result.details?.studentName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Completed Domain</span>
                    <span className="detail-val">
                      {result.details?.domainName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-val">
                      {result.details?.durationWeeks} Weeks
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Completion Date</span>
                    <span className="detail-val">
                      {new Date(result.details?.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="verification-document-preview">
                  <CertificatePreview
                    studentName={result.details?.studentName}
                    domainName={result.details?.domainName}
                    durationLabel={`${result.details?.durationWeeks} Weeks Track`}
                    certificateId={result.certificateId || searchId}
                    verificationId={searchId}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="verify-footer-links text-center">
            <span>Looking to verify an offer letter instead?</span>{" "}
            <Link to="/verify/offer" className="verify-cross-link">
              <span>Verify Offer Letter</span>
              <ArrowRight size={14} className="inline-icon" />
            </Link>
          </div>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="verify-trust-row"
        >
          <div className="trust-chip">
            <span className="trust-icon">
              <Lock size={16} />
            </span>
            <span>Tamper-proof records</span>
          </div>
          <div className="trust-chip">
            <span className="trust-icon">
              <Zap size={16} />
            </span>
            <span>Instant lookup</span>
          </div>
          <div className="trust-chip">
            <span className="trust-icon">
              <QrCode size={16} />
            </span>
            <span>QR code on every document</span>
          </div>
        </motion.div>
      </div>

      <style>{`
        .verify-page { position: relative; overflow: hidden; padding: 4.5rem 0 5rem; }
        .verify-bg-mesh { position: absolute; inset: 0; z-index: 0; background-image: var(--gradient-mesh); pointer-events: none; }
        .verify-container { position: relative; z-index: 1; max-width: 760px; }
        .verify-eyebrow { margin-bottom: 1.5rem; }
        .verify-card { display: flex; flex-direction: column; gap: 1.75rem; padding: 2.75rem; }
        .verify-icon-badge {
          width: 64px; height: 64px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.1rem auto;
        }
        .gold-glow {
          background: rgba(217, 119, 6, 0.1);
          border: 1px solid rgba(217, 119, 6, 0.28);
          color: var(--accent-amber);
          box-shadow: 0 0 0 8px rgba(217, 119, 6, 0.05);
        }
        .verify-title { font-size: 2rem; font-weight: 800; margin: 0.6rem 0 0.5rem 0; font-family: var(--font-heading); }
        .verify-subtitle { color: var(--text-muted); font-size: 0.98rem; max-width: 440px; margin: 0 auto; }
        .search-input-wrapper { display: flex; gap: 0.75rem; }
        .search-input-wrapper .input-field { flex: 1; }
        .verify-hint { display: block; font-size: 0.8rem; color: var(--text-subtle); margin-top: 0.5rem; }
        .verify-status-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1.35rem 1.5rem; border-radius: var(--radius-md); }
        .banner-success { background: rgba(5, 150, 105, 0.06); border: 1px solid rgba(5, 150, 105, 0.25); }
        .banner-error { background: rgba(220, 38, 38, 0.05); border: 1px solid rgba(220, 38, 38, 0.2); }
        .banner-success strong, .banner-success h3 { color: #047857; }
        .banner-error strong { color: var(--accent-red); }
        .banner-error p { color: #7f1d1d; font-size: 0.9rem; margin-top: 0.15rem; }
        .status-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .icon-success { background: var(--accent-emerald); color: #ffffff; }
        .icon-error { background: var(--accent-red); color: #ffffff; }
        .success-content h3 { font-size: 1.05rem; font-weight: 800; margin-bottom: 0.2rem; }
        .doc-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.1rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid rgba(5, 150, 105, 0.18); }
        .detail-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .detail-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .detail-val { font-weight: 700; color: var(--text-main); font-size: 1rem; }
        .verify-footer-links { font-size: 0.9rem; color: var(--text-muted); padding-top: 0.25rem; }
        .verify-cross-link { display: inline-flex; align-items: center; color: var(--primary); font-weight: 700; }
        .inline-icon { vertical-align: middle; margin-left: 4px; }
        .verify-trust-row { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-top: 2.25rem; }
        .trust-chip { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.7); border: 1px solid var(--border-color); padding: 0.55rem 1rem; border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 600; color: var(--text-muted); backdrop-filter: blur(8px); }
        .trust-icon { display: inline-flex; color: var(--primary); }
        @media (max-width: 600px) {
          .verify-card { padding: 2rem 1.5rem; }
          .search-input-wrapper { flex-direction: column; }
          .doc-details-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
