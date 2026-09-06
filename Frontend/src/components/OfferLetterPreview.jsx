import React from "react";
import { ShieldCheck, Download } from "lucide-react";
import "./DocumentPreview.css";

export default function OfferLetterPreview({
  studentName = "Alex Rivera",
  collegeName = "Shri Mata Vaishno Devi University",
  domainName = "Full Stack MERN Web Development",
  durationLabel = "4 Weeks",
  startDate = "Aug 01, 2026",
  endDate = "Aug 31, 2026",
  applicationId = "APP-2026-8812",
  referenceId = "OFFER-IND-2026-7731",
  verificationId = "sample-offer-verify",
  orgName = "InternDock",
  onDownload = null
}) {
  const issueDateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="doc-preview-wrapper">
      <div className="doc-preview-actions">
        <div className="doc-preview-badge">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Official Selection / Offer Letter</span>
        </div>
        {onDownload && (
          <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={onDownload}>
            <Download size={14} />
            <span>Download Official PDF</span>
          </button>
        )}
      </div>

      <div className="doc-card-frame doc-card-portrait">
        {/* Corner L-Brackets */}
        <div className="doc-corner corner-tl" />
        <div className="doc-corner corner-tr" />
        <div className="doc-corner corner-bl" />
        <div className="doc-corner corner-br" />

        <div className="doc-inner-content">
          <div className="doc-watermark" aria-hidden="true">
            <img src="/logo_mark.png" alt="" />
          </div>

          {/* Header Row */}
          <div className="doc-header-row">
            <div className="doc-brand-block">
              <img src="/logo.png" alt="InternDock" className="doc-logo-img" />
              <div className="doc-brand-titles">
                <span className="doc-brand-name">InternDock</span>
                <span className="doc-brand-tagline">TECH TALENT PLATFORM</span>
              </div>
            </div>

            <div className="doc-contact-info text-right">
              <p>support@interndock.in</p>
              <p>+91 8808307121</p>
              <p>Gorakhpur U.P. India</p>
            </div>
          </div>

          <div className="doc-divider-line" />

          {/* Meta Bar */}
          <div className="offer-meta-bar">
            <p className="offer-ref-text">Reference: <strong>{referenceId}</strong></p>
            <p className="offer-date-text">{issueDateStr}</p>
          </div>

          {/* Document Title */}
          <div className="offer-title-block text-center">
            <h1 className="offer-main-title">Internship Offer Letter</h1>
            <div className="offer-teal-bar" />
          </div>

          {/* Body Content */}
          <div className="offer-body-content">
            <h2 className="offer-salutation">Dear {studentName},</h2>
            <p className="offer-intro-p">
              We are delighted to welcome you to the Internship Program at <strong>InternDock</strong>. We believe your skills and enthusiasm will be a valuable asset to our team.
            </p>

            {/* Structured Table matching PDF */}
            <div className="offer-details-section">
              <h3 className="offer-details-title">INTERNSHIP DETAILS</h3>
              <div className="offer-details-divider" />
              <div className="offer-details-table">
                <div className="offer-table-row">
                  <span className="row-key">College / University</span>
                  <span className="row-val">{collegeName || "-"}</span>
                </div>
                <div className="offer-table-row">
                  <span className="row-key">Role</span>
                  <span className="row-val">{domainName} Intern</span>
                </div>
                <div className="offer-table-row">
                  <span className="row-key">Start Date</span>
                  <span className="row-val">{startDate || "Immediate"}</span>
                </div>
                <div className="offer-table-row">
                  <span className="row-key">End Date</span>
                  <span className="row-val">{endDate || "Upon Completion"}</span>
                </div>
                <div className="offer-table-row">
                  <span className="row-key">Type</span>
                  <span className="row-val">Project-Based / Remote</span>
                </div>
                <div className="offer-table-row">
                  <span className="row-key">Duration</span>
                  <span className="row-val">{durationLabel}</span>
                </div>
              </div>
            </div>

            <p className="offer-body-p">
              During this period, you will have the opportunity to work on real-world projects and gain hands-on experience under mentor guidance. Upon successful completion of the internship, you will be awarded an official Internship Completion Certificate.
            </p>

            <p className="offer-closing-p">
              We look forward to a productive and meaningful association with you.
            </p>

            <p className="offer-regards-line">Best regards,</p>
          </div>

          {/* Bottom Row Block with Dual Seals */}
          <div className="doc-bottom-row">
            <div className="doc-cid-block text-left">
              <span className="doc-meta-label">APPLICATION ID</span>
              <span className="doc-ref-val">{applicationId}</span>
            </div>

            <div className="doc-center-seals">
              <div className="doc-seal-badge doc-certified-badge" title="100% Official Certified Seal">
                <img src="/official_seal.png" alt="Official Certified Seal" className="doc-seal-img" />
              </div>
              <div className="doc-seal-badge doc-msme-badge" title="Govt. of India MSME Registered Enterprise">
                <img src="/msme_logo.png" alt="Govt. MSME Registered Enterprise" className="doc-msme-img" />
              </div>
            </div>

            <div className="doc-ceo-sig text-center">
              <div className="doc-sig-wrapper">
                <img src="/ceo_signature.png" alt="Founder & CEO Signature" className="doc-sig-img" />
                <div className="doc-sig-line" />
              </div>
              <span className="doc-sig-name">Aman Mishra</span>
              <span className="doc-sig-title">Founder &amp; CEO, InternDock</span>
            </div>
          </div>

          <div className="doc-verified-footer">
            <span>InternDock Verified   |   www.interndock.in   |   Govt. Registered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
