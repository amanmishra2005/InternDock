import React from "react";
import { ShieldCheck, Download } from "lucide-react";
import "./DocumentPreview.css";

export default function CertificatePreview({
  studentName = "Alex Rivera",
  collegeName = "Aston University",
  domainName = "Full Stack MERN Web Development",
  durationLabel = "4 Weeks Track",
  startDate = "Aug 01, 2026",
  endDate = "Aug 31, 2026",
  certificateId = "CERT-IND-2026-9842",
  verificationId = "sample-cert-verify",
  orgName = "InternDock",
  onDownload = null,
}) {
  const issueDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="doc-preview-wrapper">
      <div className="doc-preview-actions">
        <div className="doc-preview-badge">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Preview of verified certificate</span>
        </div>
        {onDownload && (
          <button
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={onDownload}
          >
            <Download size={14} />
            <span>Download Official PDF</span>
          </button>
        )}
      </div>

      <div className="doc-card-frame doc-card-landscape">
        {/* Corner L-Brackets */}
        <div className="doc-corner corner-tl" />
        <div className="doc-corner corner-tr" />
        <div className="doc-corner corner-bl" />
        <div className="doc-corner corner-br" />

        <div className="doc-inner-content">
          <div className="doc-company-watermark" aria-hidden="true">
            <img src="/logo_mark.png" alt="" />
          </div>

          {/* Top Header Row */}
          <div className="doc-header-row">
            <div className="doc-brand-block">
              <img
                src="/favicon.png"
                alt="InternDock"
                className="doc-logo-img"
              />
              <div className="doc-brand-titles">
                <span className="doc-brand-name">InternDock</span>
                <span className="doc-brand-tagline">TECH TALENT PLATFORM</span>
              </div>
            </div>

            <div className="doc-meta-top text-right">
              <p className="doc-meta-label">
                Certificate ID: <strong>{certificateId}</strong>
              </p>
              <p className="doc-meta-sub">Issued: {issueDateStr}</p>
            </div>
          </div>

          <div className="doc-divider-line" />

          {/* Certificate Main Content */}
          <div className="cert-body-center">
            <span className="cert-eyebrow">CERTIFICATE OF INTERNSHIP</span>
            <h1 className="cert-main-title">Certificate of Completion</h1>
            <p className="cert-certifies-line">This certifies that</p>

            <h2 className="cert-student-name">{studentName}</h2>
            <div className="cert-name-underline" />

            <p className="cert-narrative-text">
              <span>
                student of <strong>{collegeName || "-"}</strong>, has
                successfully completed an internship
              </span>
              <span>
                in the field of <strong>{domainName}</strong>,
              </span>
              <span>
                contributing to real-world projects from{" "}
                <strong>{startDate}</strong> to <strong>{endDate}</strong> under
                the guidance of <strong>InternDock</strong>.
              </span>
            </p>
          </div>

          {/* Bottom Row Block with Dual Seals */}
          <div className="doc-bottom-row">
            <div className="doc-footer-seals" aria-label="Certification marks">
              <img src="/official_seal.png" alt="Certified" />
              <img src="/msme_logo.png" alt="MSME registered" />
            </div>
            <div className="doc-ceo-sig text-center">
              <div className="doc-sig-wrapper">
                <img
                  src="/ceo_signature.png"
                  alt="Founder & CEO Signature"
                  className="doc-sig-img"
                />
                <div className="doc-sig-line" />
              </div>
              <span className="doc-sig-name">Aman Mishra</span>
              <span className="doc-sig-title">
                Founder &amp; CEO, InternDock
              </span>
            </div>
          </div>

          <div className="doc-verified-footer">
            <span>
              InternDock Certified | www.interndock.in | Govt. Registered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
