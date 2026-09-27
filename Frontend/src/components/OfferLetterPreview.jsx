import React from "react";
import { ShieldCheck, Download } from "lucide-react";
import { renderOfferLetterHtml } from "../../../shared/documentTemplates.js";
import "./DocumentPreview.css";

export default function OfferLetterPreview({
  studentName = "Alex Rivera",
  collegeName = "Aston University",
  domainName = "Full Stack MERN Web Development",
  durationLabel = "4 Weeks",
  startDate = "Aug 01, 2026",
  endDate = "Aug 31, 2026",
  applicationId = "APP-2026-8812",
  referenceId = "OFFER-IND-2026-7731",
  verificationId = "sample-offer-verify",
  orgName = "InternDock",
  onDownload = null,
}) {
  const documentHtml = renderOfferLetterHtml(
    {
      studentName,
      collegeName,
      domainName,
      durationLabel,
      startDate,
      endDate,
      applicationId,
      referenceId,
      verificationId,
      orgName,
    },
    { mode: "preview", bodyOnly: true }
  );

  return (
    <div className="doc-preview-wrapper">
      <div className="doc-preview-actions">
        <div className="doc-preview-badge">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Preview of verified offer letter</span>
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
