import React, { useRef, useState } from "react";
import { ShieldCheck, Download, Printer, Loader2 } from "lucide-react";
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
  const previewRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const card = previewRef.current?.querySelector(".doc-card-frame") || previewRef.current;
      const html2pdfModule = await import("html2pdf.js");
      const html2pdfFn = html2pdfModule.default || html2pdfModule;

      if (card && typeof html2pdfFn === "function") {
        const cleanName = (studentName || "Intern").replace(/[^a-zA-Z0-9]/g, "_");
        const opt = {
          margin: 0,
          filename: `InternDock_Certificate_${cleanName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        };
        await html2pdfFn().set(opt).from(card).save();
      } else if (onDownload) {
        await onDownload();
      }
    } catch (err) {
      console.warn("Client-side PDF generation falling back to API download:", err);
      if (onDownload) await onDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let fullHtml = renderCertificateHtml(
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
      { mode: "print", bodyOnly: false },
    );
    if (origin) {
      fullHtml = fullHtml.replace("<head>", `<head><base href="${origin}/">`);
    }
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  };

  return (
    <div className="doc-preview-wrapper">
      <div className="doc-preview-actions">
        <div className="doc-preview-badge">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Preview of verified certificate</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={handlePrint}
            title="Print or Save as Vector PDF via browser"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={handleDownloadPdf}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{isExporting ? "Generating..." : "Download Official PDF"}</span>
          </button>
        </div>
      </div>

      <div
        ref={previewRef}
        className="doc-rendered-container"
        dangerouslySetInnerHTML={{ __html: documentHtml }}
      />
    </div>
  );
}
