/**
 * Single Shared Document Template System for InternDock
 * 
 * Used by BOTH:
 * 1. Live Preview components in React (OfferLetterPreview, CertificatePreview)
 * 2. Downloadable PDF generation engine (generateOfferLetterPdf, generateCertificatePdf)
 * 
 * Guarantee: Preview and Downloadable PDF share the EXACT same HTML structure,
 * CSS styles, typography, layout, seals, signatures, and dimensions.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateSafe(val, fallback = "Immediate") {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    return String(val) || fallback;
  }
}

const DOCUMENT_STYLES = `
  /* Reset & Baseline */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Font configuration */
  .doc-font-serif {
    font-family: Georgia, "Times New Roman", Times, serif;
  }
  .doc-font-sans {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* Document Frame */
  .doc-card-frame {
    position: relative;
    width: 100%;
    min-width: 0;
    background: #fffdf8;
    color: #0f172a;
    border-radius: 6px;
    padding: 1.25rem;
    box-shadow:
      0 20px 45px -15px rgba(15, 23, 42, 0.18),
      0 0 0 1px rgba(15, 23, 42, 0.1);
    border: 2px solid #0f172a;
    box-sizing: border-box;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .doc-card-portrait {
    max-width: 640px;
    margin-inline: auto;
  }

  .doc-card-landscape {
    max-width: 840px;
    margin-inline: auto;
  }

  .doc-inner-content {
    border: 1px solid #0f172a;
    border-radius: 4px;
    padding: 2.25rem 2rem 1.25rem 2rem;
    background-color: #fffdf8;
    background-image: radial-gradient(#d8d2c2 0.85px, transparent 0.85px);
    background-size: 16px 16px;
    position: relative;
    overflow: hidden;
    min-width: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Decorative Corner L-Brackets */
  .doc-corner {
    position: absolute;
    width: 16px;
    height: 16px;
    pointer-events: none;
    z-index: 3;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .corner-tl {
    top: 14px;
    left: 14px;
    border-top: 2.5px solid #0f172a;
    border-left: 2.5px solid #0f172a;
  }
  .corner-tr {
    top: 14px;
    right: 14px;
    border-top: 2.5px solid #0f172a;
    border-right: 2.5px solid #0f172a;
  }
  .corner-bl {
    bottom: 14px;
    left: 14px;
    border-bottom: 2.5px solid #0f172a;
    border-left: 2.5px solid #0f172a;
  }
  .corner-br {
    bottom: 14px;
    right: 14px;
    border-bottom: 2.5px solid #0f172a;
    border-right: 2.5px solid #0f172a;
  }

  /* Watermark */
  .doc-company-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(52%, 310px);
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    opacity: 0.085;
    pointer-events: none;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .doc-company-watermark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Header Row */
  .doc-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
    min-width: 0;
  }

  .doc-brand-block {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    flex: 0 0 auto;
  }

  .doc-meta-top,
  .doc-contact-info {
    margin-left: auto;
    text-align: right;
  }

  .doc-logo-img {
    width: 42px;
    height: 42px;
    object-fit: contain;
    border-radius: 9px;
    background: #111827;
    padding: 3px;
    box-shadow: 0 3px 8px rgba(15, 23, 42, 0.14);
  }

  .doc-brand-titles {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .doc-brand-name {
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
  }

  .doc-brand-tagline {
    font-size: 0.58rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.12em;
    margin-top: 2px;
  }

  .doc-meta-top p,
  .doc-contact-info p {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.35;
  }

  .doc-meta-label {
    color: #64748b;
  }
  .doc-meta-label strong {
    color: #0f172a;
  }

  .doc-divider-line {
    height: 1px;
    background: #d6cfba;
    margin: 1rem 0 1.25rem 0;
    position: relative;
    z-index: 1;
  }

  /* Offer Letter Specific Content */
  .offer-meta-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    color: #64748b;
    position: relative;
    z-index: 1;
    margin-bottom: 1.25rem;
  }

  .offer-ref-text strong {
    color: #0f172a;
  }

  .offer-date-text {
    font-weight: 700;
    color: #0f172a;
  }

  .offer-title-block {
    text-align: center;
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 1;
  }

  .offer-main-title {
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: 1.85rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.5rem 0;
  }

  .offer-teal-bar {
    width: 180px;
    height: 2.5px;
    background: #0d9488;
    margin: 0 auto;
  }

  .offer-body-content {
    position: relative;
    z-index: 1;
    font-size: 0.92rem;
    color: #334155;
    line-height: 1.6;
  }

  .offer-salutation {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.75rem;
  }

  .offer-intro-p {
    margin-bottom: 1.25rem;
  }

  .offer-details-section {
    margin: 1.25rem 0;
  }

  .offer-details-title {
    font-size: 0.8rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
  }

  .offer-details-divider {
    height: 1px;
    background: #d6cfba;
    margin-bottom: 0.75rem;
  }

  .offer-details-table {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .offer-table-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.35rem 0;
    border-bottom: 1px solid #ece5d3;
    font-size: 0.88rem;
    gap: 1rem;
  }

  .row-key {
    color: #64748b;
    font-weight: 500;
    flex-shrink: 0;
  }

  .row-val {
    color: #0f172a;
    font-weight: 700;
    font-style: italic;
    text-align: right;
    word-break: break-word;
  }

  .offer-body-p,
  .offer-closing-p {
    margin-bottom: 1rem;
  }

  .offer-regards-line {
    font-weight: 800;
    color: #0f172a;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  /* Certificate Specific Content */
  .cert-body-center {
    text-align: center;
    position: relative;
    z-index: 1;
    margin: 0.75rem 0;
  }

  .cert-eyebrow {
    display: block;
    font-size: 0.82rem;
    font-weight: 800;
    color: #0d9488;
    letter-spacing: 0.2em;
    margin-bottom: 0.5rem;
  }

  .cert-main-title {
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: clamp(1.8rem, 4vw, 2.25rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #0f172a;
    margin: 0 0 0.75rem 0;
  }

  .cert-certifies-line {
    font-size: 0.95rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .cert-student-name {
    font-family: Georgia, "Times New Roman", Times, serif;
    font-style: italic;
    font-size: clamp(1.7rem, 3.5vw, 2.1rem);
    font-weight: 700;
    letter-spacing: -0.015em;
    color: #0f172a;
    margin: 0.4rem 0 0.25rem 0;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
    word-break: break-word;
    line-height: 1.2;
  }

  .cert-name-underline {
    width: 240px;
    height: 1px;
    background: #c9c2ac;
    margin: 0 auto 1.25rem auto;
  }

  .cert-narrative-text {
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: clamp(0.74rem, 1.15vw, 0.92rem);
    font-weight: 400;
    color: #334155;
    line-height: 1.6;
    width: 100%;
    max-width: 90%;
    margin: 0 auto;
    text-align: center;
  }

  .cert-narrative-text span {
    display: block;
  }

  .cert-narrative-text strong {
    color: #0f172a;
    font-weight: 700;
  }

  /* Dual Seals & Bottom Block */
  .doc-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.75rem;
    padding-top: 0.75rem;
    position: relative;
    z-index: 1;
    min-width: 0;
  }

  .doc-cid-block {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 140px;
    text-align: left;
  }

  .doc-ref-val {
    font-size: 0.88rem;
    font-weight: 800;
    color: #0f172a;
  }

  .doc-footer-seals {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex-shrink: 0;
    opacity: 0.58;
  }

  .doc-footer-seals img {
    width: 62px;
    height: 62px;
    object-fit: contain;
  }

  .doc-ceo-sig {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 154px;
    text-align: center;
  }

  .doc-sig-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 154px;
  }

  .doc-sig-img {
    height: 48px;
    width: auto;
    object-fit: contain;
    margin-bottom: -16px;
    position: relative;
    z-index: 2;
  }

  .doc-sig-line {
    width: 154px;
    height: 1px;
    background: #64748b;
    z-index: 1;
  }

  .doc-sig-name {
    font-size: 0.88rem;
    font-weight: 800;
    color: #0f172a;
    margin-top: 0.35rem;
  }

  .doc-sig-title {
    font-size: 0.72rem;
    color: #64748b;
  }

  .doc-verified-footer {
    text-align: center;
    margin-top: 1.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: #64748b;
    opacity: 0.62;
    letter-spacing: 0.05em;
    position: relative;
    z-index: 1;
  }

  /* Exact Print Page Styling (For PDF Generation) */
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body.doc-print-portrait {
      width: 210mm !important;
      height: 297mm !important;
    }
    body.doc-print-landscape {
      width: 297mm !important;
      height: 210mm !important;
    }

    .doc-print-portrait .doc-card-frame {
      width: 210mm !important;
      height: 297mm !important;
      max-width: 210mm !important;
      padding: 11mm !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      display: flex !important;
      flex-direction: column !important;
      page-break-inside: avoid !important;
    }

    .doc-print-landscape .doc-card-frame {
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      padding: 10mm !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      display: flex !important;
      flex-direction: column !important;
      page-break-inside: avoid !important;
    }

    .doc-print-portrait .doc-inner-content {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      padding: 12mm 14mm 9mm 14mm !important;
    }

    .doc-print-landscape .doc-inner-content {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      padding: 10mm 15mm 7mm 15mm !important;
    }

    .doc-print-portrait .offer-main-title {
      font-size: 2.1rem !important;
    }
    .doc-print-landscape .cert-main-title {
      font-size: 2.45rem !important;
    }
    .doc-print-landscape .cert-student-name {
      font-size: 2.25rem !important;
    }
    .doc-print-landscape .cert-narrative-text {
      font-size: 0.95rem !important;
      line-height: 1.55 !important;
    }
    .doc-print-portrait .doc-bottom-row,
    .doc-print-landscape .doc-bottom-row {
      margin-top: auto !important;
    }
  }

  /* Responsive screen previews */
  @media screen and (max-width: 640px) {
    .doc-inner-content {
      padding: 1.5rem 1rem 1rem 1rem;
    }
    .doc-header-row,
    .doc-bottom-row {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center !important;
    }
    .doc-meta-top,
    .doc-contact-info,
    .doc-cid-block {
      text-align: center !important;
      margin-left: 0;
    }
    .cert-main-title {
      font-size: 1.75rem;
    }
    .cert-student-name {
      font-size: 1.6rem;
    }
    .offer-main-title {
      font-size: 1.5rem;
    }
    .offer-meta-bar,
    .offer-table-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.15rem;
    }
    .row-val {
      text-align: left;
    }
  }
`;

/**
 * Shared Offer Letter Template Generator
 */
function renderOfferLetterHtml(data = {}, options = {}) {
  const {
    studentName = "Alex Rivera",
    collegeName = "Aston University",
    domainName = "Full Stack MERN Web Development",
    durationLabel = "4 Weeks Track",
    startDate,
    endDate,
    issueDate,
    applicationId = "APP-2026-8812",
    referenceId = "OFFER-IND-2026-7731",
    verificationId,
    orgName = "InternDock",
    assets = {},
  } = data;

  const { mode = "preview", bodyOnly = false } = options;

  const issueDateFormatted = formatDateSafe(issueDate || new Date(), "Today");
  const startFormatted = formatDateSafe(startDate, "Immediate");
  const endFormatted = formatDateSafe(endDate, "Upon Completion");

  const logoMarkSrc = assets.logoMark || "/logo_mark.png";
  const faviconSrc = assets.favicon || "/favicon.png";
  const sealSrc = assets.seal || "/official_seal.png";
  const msmeSrc = assets.msme || "/msme_logo.png";
  const signatureSrc = assets.signature || "/ceo_signature.png";

  const bodyContent = `
    <div class="doc-card-frame doc-card-portrait">
      <!-- Corner L-Brackets -->
      <div class="doc-corner corner-tl"></div>
      <div class="doc-corner corner-tr"></div>
      <div class="doc-corner corner-bl"></div>
      <div class="doc-corner corner-br"></div>

      <div class="doc-inner-content">
        <div class="doc-company-watermark" aria-hidden="true">
          <img src="${logoMarkSrc}" alt="" />
        </div>

        <div class="doc-body-top-group">
          <!-- Header Row -->
          <div class="doc-header-row">
            <div class="doc-brand-block">
              <img src="${faviconSrc}" alt="${escapeHtml(orgName)}" class="doc-logo-img" />
              <div class="doc-brand-titles">
                <span class="doc-brand-name">${escapeHtml(orgName)}</span>
                <span class="doc-brand-tagline">TECH TALENT PLATFORM</span>
              </div>
            </div>

            <div class="doc-contact-info">
              <p>www.interndock.in</p>
              <p>Gorakhpur U.P. India</p>
            </div>
          </div>

          <div class="doc-divider-line"></div>

          <!-- Meta Bar -->
          <div class="offer-meta-bar">
            <p class="offer-ref-text">Reference: <strong>${escapeHtml(referenceId)}</strong></p>
            <p class="offer-date-text">${escapeHtml(issueDateFormatted)}</p>
          </div>

          <!-- Document Title -->
          <div class="offer-title-block">
            <h1 class="offer-main-title">Internship Offer Letter</h1>
            <div class="offer-teal-bar"></div>
          </div>

          <!-- Body Content -->
          <div class="offer-body-content">
            <h2 class="offer-salutation">Dear ${escapeHtml(studentName)},</h2>
            <p class="offer-intro-p">
              We are delighted to welcome you to the Internship Program at <strong>${escapeHtml(orgName)}</strong>. We believe your skills and enthusiasm will be a valuable asset to our team.
            </p>

            <!-- Structured Details Table -->
            <div class="offer-details-section">
              <h3 class="offer-details-title">INTERNSHIP DETAILS</h3>
              <div class="offer-details-divider"></div>
              <div class="offer-details-table">
                <div class="offer-table-row">
                  <span class="row-key">College / University</span>
                  <span class="row-val">${escapeHtml(collegeName || "-")}</span>
                </div>
                <div class="offer-table-row">
                  <span class="row-key">Role</span>
                  <span class="row-val">${escapeHtml(domainName)} Intern</span>
                </div>
                <div class="offer-table-row">
                  <span class="row-key">Start Date</span>
                  <span class="row-val">${escapeHtml(startFormatted)}</span>
                </div>
                <div class="offer-table-row">
                  <span class="row-key">End Date</span>
                  <span class="row-val">${escapeHtml(endFormatted)}</span>
                </div>
                <div class="offer-table-row">
                  <span class="row-key">Type</span>
                  <span class="row-val">Project-Based / Remote</span>
                </div>
                <div class="offer-table-row">
                  <span class="row-key">Duration</span>
                  <span class="row-val">${escapeHtml(durationLabel)}</span>
                </div>
              </div>
            </div>

            <p class="offer-body-p">
              During this period, you will have the opportunity to work on real-world projects and gain hands-on experience under mentor guidance. Upon successful completion of the internship, you will be awarded an official Internship Completion Certificate.
            </p>

            <p class="offer-closing-p">
              We look forward to a productive and meaningful association with you.
            </p>

            <p class="offer-regards-line">Best regards,</p>
          </div>
        </div>

        <div class="doc-body-bottom-group">
          <!-- Bottom Row Block with Dual Seals & Signature -->
          <div class="doc-bottom-row">
            <div class="doc-cid-block">
              <span class="doc-meta-label">APPLICATION ID</span>
              <span class="doc-ref-val">${escapeHtml(applicationId)}</span>
            </div>

            <div class="doc-footer-seals" aria-label="Certification marks">
              <img src="${sealSrc}" alt="Certified" />
              <img src="${msmeSrc}" alt="MSME registered" />
            </div>

            <div class="doc-ceo-sig">
              <div class="doc-sig-wrapper">
                <img src="${signatureSrc}" alt="Founder & CEO Signature" class="doc-sig-img" />
                <div class="doc-sig-line"></div>
              </div>
              <span class="doc-sig-name">Aman Mishra</span>
              <span class="doc-sig-title">Founder &amp; CEO, ${escapeHtml(orgName)}</span>
            </div>
          </div>

          <div class="doc-verified-footer">
            <span>InternDock Certified | www.interndock.in | Govt. Registered</span>
          </div>
        </div>
      </div>
    </div>
  `;

  if (bodyOnly) return bodyContent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Internship Offer Letter - ${escapeHtml(studentName)} - InternDock</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    ${DOCUMENT_STYLES}
  </style>
</head>
<body class="${mode === 'print' ? 'doc-print-portrait' : ''}">
  ${bodyContent}
</body>
</html>`;
}

/**
 * Shared Certificate Template Generator
 */
function renderCertificateHtml(data = {}, options = {}) {
  const {
    studentName = "Alex Rivera",
    collegeName = "Aston University",
    domainName = "Full Stack MERN Web Development",
    durationLabel = "4 Weeks Track",
    startDate,
    endDate,
    issueDate,
    certificateId = "CERT-IND-2026-9842",
    verificationId,
    orgName = "InternDock",
    assets = {},
  } = data;

  const { mode = "preview", bodyOnly = false } = options;

  const issueDateFormatted = formatDateSafe(issueDate || new Date(), "Today");
  const startFormatted = formatDateSafe(startDate, "Start Date");
  const endFormatted = formatDateSafe(endDate, "End Date");

  const logoMarkSrc = assets.logoMark || "/logo_mark.png";
  const faviconSrc = assets.favicon || "/favicon.png";
  const sealSrc = assets.seal || "/official_seal.png";
  const msmeSrc = assets.msme || "/msme_logo.png";
  const signatureSrc = assets.signature || "/ceo_signature.png";

  const hasCollege = collegeName && String(collegeName).trim() && String(collegeName).trim() !== "-";

  const bodyContent = `
    <div class="doc-card-frame doc-card-landscape">
      <!-- Corner L-Brackets -->
      <div class="doc-corner corner-tl"></div>
      <div class="doc-corner corner-tr"></div>
      <div class="doc-corner corner-bl"></div>
      <div class="doc-corner corner-br"></div>

      <div class="doc-inner-content">
        <div class="doc-company-watermark" aria-hidden="true">
          <img src="${logoMarkSrc}" alt="" />
        </div>

        <div class="doc-body-top-group">
          <!-- Top Header Row -->
          <div class="doc-header-row">
            <div class="doc-brand-block">
              <img src="${faviconSrc}" alt="${escapeHtml(orgName)}" class="doc-logo-img" />
              <div class="doc-brand-titles">
                <span class="doc-brand-name">${escapeHtml(orgName)}</span>
                <span class="doc-brand-tagline">TECH TALENT PLATFORM</span>
              </div>
            </div>

            <div class="doc-meta-top">
              <p class="doc-meta-label">Certificate ID: <strong>${escapeHtml(certificateId)}</strong></p>
              <p class="doc-meta-sub">Issued: ${escapeHtml(issueDateFormatted)}</p>
            </div>
          </div>

          <div class="doc-divider-line"></div>
        </div>

        <!-- Certificate Main Content -->
        <div class="cert-body-center">
          <span class="cert-eyebrow">CERTIFICATE OF INTERNSHIP</span>
          <h1 class="cert-main-title">Certificate of Completion</h1>
          <p class="cert-certifies-line">This certifies that</p>

          <h2 class="cert-student-name">${escapeHtml(studentName)}</h2>
          <div class="cert-name-underline"></div>

          <p class="cert-narrative-text">
            <span>
              ${hasCollege ? `student of <strong>${escapeHtml(collegeName)}</strong>, has ` : `has `}successfully completed an internship
            </span>
            <span>in the field of <strong>${escapeHtml(domainName)}</strong>,</span>
            <span>contributing to real-world projects from <strong>${escapeHtml(startFormatted)}</strong> to <strong>${escapeHtml(endFormatted)}</strong> under the guidance of <strong>${escapeHtml(orgName)}</strong>.</span>
          </p>
        </div>

        <div class="doc-body-bottom-group">
          <!-- Bottom Row Block with Dual Seals & Signature -->
          <div class="doc-bottom-row">
            <div class="doc-footer-seals" aria-label="Certification marks">
              <img src="${sealSrc}" alt="Certified" />
              <img src="${msmeSrc}" alt="MSME registered" />
            </div>

            <div class="doc-ceo-sig">
              <div class="doc-sig-wrapper">
                <img src="${signatureSrc}" alt="Founder & CEO Signature" class="doc-sig-img" />
                <div class="doc-sig-line"></div>
              </div>
              <span class="doc-sig-name">Aman Mishra</span>
              <span class="doc-sig-title">Founder &amp; CEO, ${escapeHtml(orgName)}</span>
            </div>
          </div>

          <div class="doc-verified-footer">
            <span>InternDock Certified | www.interndock.in | Govt. Registered</span>
          </div>
        </div>
      </div>
    </div>
  `;

  if (bodyOnly) return bodyContent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Certificate of Completion - ${escapeHtml(studentName)} - InternDock</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    ${DOCUMENT_STYLES}
  </style>
</head>
<body class="${mode === 'print' ? 'doc-print-landscape' : ''}">
  ${bodyContent}
</body>
</html>`;
}

// Universal Module Definition support
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    renderOfferLetterHtml,
    renderCertificateHtml,
    DOCUMENT_STYLES,
    formatDateSafe,
  };
}

export {
  renderOfferLetterHtml,
  renderCertificateHtml,
  DOCUMENT_STYLES,
  formatDateSafe,
};
