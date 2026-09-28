import React from "react";
import { ShieldCheck, Download } from "lucide-react";
import { renderCertificateHtml } from "../../../shared/documentTemplates.js";
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
  const documentHtml = renderCertificateHtml(
    {
      studentName,
      collegeName,
      domainName,
      durationLabel,
      startDate,
      endDate,
      certificateId,
      verificationId,
      orgName,
    },
    { mode: "preview", bodyOnly: false },
  );

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

      <div
        className="doc-rendered-container"
        dangerouslySetInnerHTML={{ __html: documentHtml }}
      />
    </div>
  );
}
