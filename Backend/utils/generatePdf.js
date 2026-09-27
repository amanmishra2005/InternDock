const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const PDFDocument = require("pdfkit");
const {
  renderOfferLetterHtml,
  renderCertificateHtml,
  formatDateSafe,
} = require("../../shared/documentTemplates");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ASSETS_DIR = path.join(__dirname, "..", "assets");
const SIGNATURE_PATH = path.join(ASSETS_DIR, "ceo_signature.png");
const COMPANY_LOGO_PATH = path.join(ASSETS_DIR, "company_logo.png");
const SEAL_PATH = path.join(ASSETS_DIR, "official_seal.png");
const MSME_LOGO_PATH = path.join(ASSETS_DIR, "msme_logo.png");
const FAVICON_PATH = path.join(ASSETS_DIR, "favicon.png");
const LOGO_MARK_PATH = path.join(ASSETS_DIR, "logo_mark.png");

const TEAL = "#0d9488";
const NAVY = "#0f172a";
const GOLD = "#c9962f";
const GRAY = "#64748b";

// Bump this any time the offer letter / certificate design changes
const TEMPLATE_VERSION = "2026-09-28-v7-unified";

function getAssetBase64(filename) {
  const p = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(p)) return "";
  const buf = fs.readFileSync(p);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

let cachedAssets = null;
function loadDocumentAssets() {
  if (!cachedAssets) {
    cachedAssets = {
      logoMark: getAssetBase64("logo_mark.png"),
      favicon: getAssetBase64("favicon.png"),
      seal: getAssetBase64("official_seal.png"),
      msme: getAssetBase64("msme_logo.png"),
      signature: getAssetBase64("ceo_signature.png"),
    };
  }
  return cachedAssets;
}

function findChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.env.GOOGLE_CHROME_BIN && fs.existsSync(process.env.GOOGLE_CHROME_BIN)) return process.env.GOOGLE_CHROME_BIN;

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  try {
    const whichOut = execSync("which google-chrome chromium chromium-browser 2>/dev/null", { encoding: "utf8" }).trim();
    if (whichOut) {
      const first = whichOut.split("\n")[0].trim();
      if (first && fs.existsSync(first)) return first;
    }
  } catch (e) {}

  return null;
}

function convertHtmlToPdfWithChrome(htmlContent, destPdfPath) {
  const chromePath = findChromeExecutable();
  if (!chromePath) return false;

  const tempHtmlPath = path.join(os.tmpdir(), `interndock-doc-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent, "utf8");

  try {
    execSync(
      `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --print-to-pdf="${destPdfPath}" "${tempHtmlPath}"`,
      { stdio: "pipe", timeout: 20000 }
    );
    return fs.existsSync(destPdfPath) && fs.statSync(destPdfPath).size > 1000;
  } catch (err) {
    console.error("Chrome headless render failed:", err.message);
    return false;
  } finally {
    try {
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    } catch (e) {}
  }
}

// ---------- PDFKit Fallback Helper Methods (If Chrome is not installed) ----------

function drawDottedBackground(doc, w, h, margin = 26, spacing = 16) {
  doc.save();
  doc.fillColor("#d8d2c2");
  for (let x = margin; x < w - margin; x += spacing) {
    for (let y = margin; y < h - margin; y += spacing) {
      doc.circle(x, y, 0.55).fill();
    }
  }
  doc.restore();
}

function drawFrame(doc, w, h, color = NAVY) {
  const m = 18;
  doc.save();
  doc.lineWidth(1.5).strokeColor(color).rect(m, m, w - m * 2, h - m * 2).stroke();
  doc.lineWidth(0.75).strokeColor(color).rect(m + 5, m + 5, w - (m + 5) * 2, h - (m + 5) * 2).stroke();

  const hook = 16;
  const corners = [
    [m + 5, m + 5, 1, 1],
    [w - (m + 5), m + 5, -1, 1],
    [m + 5, h - (m + 5), 1, -1],
    [w - (m + 5), h - (m + 5), -1, -1],
  ];
  doc.lineWidth(2.5).strokeColor(color);
  corners.forEach(([cx, cy, dx, dy]) => {
    doc.moveTo(cx, cy + dy * hook).lineTo(cx, cy).lineTo(cx + dx * hook, cy).stroke();
  });
  doc.restore();
}

function drawDualSeals(doc, cx, cy, size = 52) {
  const gap = 14;
  const totalW = size * 2 + gap;
  const startX = cx - totalW / 2;

  // 1. Official Seal (Left)
  const sealX = startX;
  const sealY = cy - size / 2;
  const sealCenterX = sealX + size / 2;

  if (fs.existsSync(SEAL_PATH)) {
    doc.save();
    doc.circle(sealCenterX, cy, size / 2).clip();
    doc.rect(sealX, sealY, size, size).fill("#ffffff");
    doc.image(SEAL_PATH, sealX + 2, sealY + 2, { fit: [size - 4, size - 4] });
    doc.restore();
    doc.save();
    doc.lineWidth(1.2).strokeColor(TEAL).circle(sealCenterX, cy, size / 2).stroke();
    doc.restore();
  }

  // 2. MSME Logo (Right)
  const msmeX = startX + size + gap;
  const msmeY = cy - size / 2;
  const msmeCenterX = msmeX + size / 2;

  if (fs.existsSync(MSME_LOGO_PATH)) {
    doc.save();
    doc.circle(msmeCenterX, cy, size / 2).clip();
    doc.rect(msmeX, msmeY, size, size).fill("#ffffff");
    doc.image(MSME_LOGO_PATH, msmeX + 2, msmeY + 2, { fit: [size - 4, size - 4] });
    doc.restore();
    doc.save();
    doc.lineWidth(1.2).strokeColor(GOLD).circle(msmeCenterX, cy, size / 2).stroke();
    doc.restore();
  }
}

function verifiedFooter(doc, w, bottomY) {
  const text = "InternDock Certified   |   www.interndock.in   |   Govt. Registered";
  doc.fontSize(8.5).font("Helvetica").fillColor(GRAY).text(text, 0, bottomY, { width: w, align: "center" });
}

function generateOfferLetterPdfWithPdfKit(data, filepath) {
  return new Promise((resolve, reject) => {
    try {
      const {
        studentName = "Intern Student",
        collegeName = "-",
        domainName = "Tech Domain",
        durationLabel = "4 Weeks Track",
        startDate,
        endDate,
        issueDate,
        applicationId,
        referenceId,
      } = data;

      const doc = new PDFDocument({ size: "A4", margins: { top: 38, bottom: 20, left: 44, right: 44 } });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const w = doc.page.width;
      const h = doc.page.height;

      doc.rect(0, 0, w, h).fill("#fffdf8");
      drawDottedBackground(doc, w, h);
      drawFrame(doc, w, h);

      const issueDateStr = formatDateSafe(issueDate || new Date(), "Today");
      const startStr = formatDateSafe(startDate, "Immediate");
      const endStr = formatDateSafe(endDate, "Upon Completion");

      let y = 38;

      if (fs.existsSync(FAVICON_PATH)) {
        doc.image(FAVICON_PATH, 44, y, { fit: [38, 38] });
      } else if (fs.existsSync(COMPANY_LOGO_PATH)) {
        doc.image(COMPANY_LOGO_PATH, 44, y, { fit: [38, 38] });
      }
      doc.fontSize(17).font("Times-Bold").fillColor(NAVY).text("InternDock", 90, y + 1);
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(GRAY).text("TECH TALENT PLATFORM", 90, y + 21, { characterSpacing: 1 });

      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY).text("www.interndock.in", 0, y + 6, { width: w - 44, align: "right" });
      doc.text("Gorakhpur U.P. India", 0, y + 18, { width: w - 44, align: "right" });

      y += 48;
      doc.moveTo(44, y).lineTo(w - 44, y).lineWidth(0.75).strokeColor("#d6cfba").stroke();
      y += 14;

      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(`Reference: `, 44, y, { continued: true });
      doc.font("Helvetica-Bold").fillColor(NAVY).text(referenceId || "");
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(NAVY).text(issueDateStr, 0, y, { width: w - 44, align: "right" });

      y += 24;
      doc.fontSize(22).font("Times-Bold").fillColor(NAVY).text("Internship Offer Letter", 44, y, { width: w - 88, align: "center" });
      y += 28;
      doc.moveTo(w / 2 - 85, y).lineTo(w / 2 + 85, y).lineWidth(2).strokeColor(TEAL).stroke();
      y += 20;

      doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY).text(`Dear ${studentName},`, 44, y);
      y += 18;

      doc.fontSize(10).font("Helvetica").fillColor("#334155").text(
        `We are delighted to welcome you to the Internship Program at `, 44, y, { continued: true, width: w - 88, lineGap: 3 }
      );
      doc.font("Helvetica-Bold").fillColor(NAVY).text("InternDock", { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(". We believe your skills and enthusiasm will be a valuable asset to our team.");
      y = doc.y + 14;

      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(NAVY).text("INTERNSHIP DETAILS", 44, y, { characterSpacing: 0.8 });
      y += 16;
      doc.moveTo(44, y).lineTo(w - 44, y).lineWidth(0.6).strokeColor("#d6cfba").stroke();
      y += 8;

      const rows = [
        ["College / University", collegeName || "-"],
        ["Role", `${domainName} Intern`],
        ["Start Date", startStr],
        ["End Date", endStr],
        ["Type", "Project-Based / Remote"],
        ["Duration", durationLabel],
      ];
      rows.forEach(([label, value]) => {
        doc.fontSize(9.5).font("Helvetica").fillColor(GRAY).text(label, 44, y, { width: 140 });
        doc.fontSize(9.5).font("Helvetica-BoldOblique").fillColor(NAVY).text(value, 200, y, { width: w - 200 - 44 });
        y += 18;
        doc.moveTo(44, y - 4).lineTo(w - 44, y - 4).lineWidth(0.4).strokeColor("#ece5d3").stroke();
      });

      y += 8;
      doc.fontSize(10).font("Helvetica").fillColor("#334155").text(
        "During this period, you will have the opportunity to work on real-world projects and gain hands-on experience under mentor guidance. Upon successful completion of the internship, you will be awarded an official Internship Completion Certificate.",
        44, y, { width: w - 88, align: "justify", lineGap: 3 }
      );
      y = doc.y + 12;

      doc.fontSize(10).font("Helvetica").fillColor("#334155").text(
        "We look forward to a productive and meaningful association with you.", 44, y, { width: w - 88 }
      );
      y = doc.y + 14;

      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text("Best regards,", 44, y);

      const btmY = h - 116;

      doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("APPLICATION ID", 44, btmY, { characterSpacing: 0.6 });
      doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text(applicationId || "", 44, btmY + 12);

      drawDualSeals(doc, w / 2, btmY + 20, 50);

      const sigX = w - 190;
      doc.moveTo(sigX, btmY + 26).lineTo(sigX + 146, btmY + 26).lineWidth(1).strokeColor(GRAY).stroke();
      if (fs.existsSync(SIGNATURE_PATH)) {
        doc.image(SIGNATURE_PATH, sigX + 8, btmY - 18, { fit: [125, 48] });
      }
      doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Aman Mishra", sigX, btmY + 32, { width: 146, align: "center" });
      doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("Founder & CEO, InternDock", sigX, btmY + 45, { width: 146, align: "center" });

      verifiedFooter(doc, w, h - 38);

      doc.end();
      stream.on("finish", () => resolve(true));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

function generateCertificatePdfWithPdfKit(data, filepath) {
  return new Promise((resolve, reject) => {
    try {
      const {
        studentName = "Intern Student",
        collegeName = "-",
        domainName = "Tech Domain",
        durationLabel = "4 Weeks Track",
        startDate,
        endDate,
        issueDate,
        certificateId,
      } = data;

      const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 32, bottom: 18, left: 36, right: 36 } });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const w = doc.page.width;
      const h = doc.page.height;

      doc.rect(0, 0, w, h).fill("#fffdf8");
      drawDottedBackground(doc, w, h);
      drawFrame(doc, w, h);

      const startStr = formatDateSafe(startDate, "Start Date");
      const endStr = formatDateSafe(endDate, "End Date");
      const issueDateStr = formatDateSafe(issueDate || new Date(), "Today");

      let y = 32;

      if (fs.existsSync(FAVICON_PATH)) {
        doc.image(FAVICON_PATH, 42, y, { fit: [36, 36] });
      } else if (fs.existsSync(COMPANY_LOGO_PATH)) {
        doc.image(COMPANY_LOGO_PATH, 42, y, { fit: [36, 36] });
      }
      doc.fontSize(16).font("Times-Bold").fillColor(NAVY).text("InternDock", 86, y + 1);
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(GRAY).text("TECH TALENT PLATFORM", 86, y + 20, { characterSpacing: 1 });

      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY).text(`Certificate ID: `, 0, y + 2, { width: w - 86, align: "right", continued: true });
      doc.font("Helvetica-Bold").fillColor(NAVY).text(certificateId || "");
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY).text(`Issued: ${issueDateStr}`, 0, y + 18, { width: w - 86, align: "right" });

      y += 42;
      doc.moveTo(42, y).lineTo(w - 42, y).lineWidth(0.75).strokeColor("#d6cfba").stroke();
      y += 18;

      doc.fontSize(10).font("Helvetica-Bold").fillColor(TEAL).text("CERTIFICATE OF INTERNSHIP", 0, y, { align: "center", characterSpacing: 2.2 });
      y += 18;

      doc.fontSize(28).font("Times-Bold").fillColor(NAVY).text("Certificate of Completion", 0, y, { align: "center" });
      y += 42;

      doc.fontSize(10.5).font("Helvetica").fillColor(GRAY).text("This certifies that", 0, y, { align: "center" });
      y += 18;

      doc.fontSize(24).font("Times-BoldItalic").fillColor(NAVY).text(studentName, 0, y, { align: "center" });
      y = doc.y + 6;
      doc.moveTo(w / 2 - 120, y).lineTo(w / 2 + 120, y).lineWidth(0.75).strokeColor("#c9c2ac").stroke();
      y += 16;

      const hasCollege = collegeName && String(collegeName).trim() && String(collegeName).trim() !== "-";
      const bodyLine1 = hasCollege
        ? `student of ${String(collegeName).trim()}, has successfully completed an internship`
        : `has successfully completed an internship`;
      const bodyLine2 = `in the field of ${domainName},`;
      const bodyLine3 = `contributing to real-world projects from ${startStr} to ${endStr} under the guidance of InternDock.`;

      doc.fontSize(13).font("Times-Roman").fillColor("#334155");
      doc.text(bodyLine1, 50, y, { width: w - 100, align: "center" });
      y = doc.y + 6;
      doc.text(bodyLine2, 50, y, { width: w - 100, align: "center" });
      y = doc.y + 6;
      doc.text(bodyLine3, 50, y, { width: w - 100, align: "center" });

      const btmY = h - 120;

      // Dual seals on bottom-left, matching the preview component layout
      drawDualSeals(doc, 110, btmY + 24, 52);

      const sigX = w - 195;
      doc.moveTo(sigX, btmY + 28).lineTo(sigX + 150, btmY + 28).lineWidth(1).strokeColor(GRAY).stroke();
      if (fs.existsSync(SIGNATURE_PATH)) {
        doc.image(SIGNATURE_PATH, sigX + 10, btmY - 18, { fit: [130, 50] });
      }
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text("Aman Mishra", sigX, btmY + 34, { width: 150, align: "center" });
      doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("Founder & CEO, InternDock", sigX, btmY + 47, { width: 150, align: "center" });

      verifiedFooter(doc, w, h - 30);

      doc.end();
      stream.on("finish", () => resolve(true));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ---------- Main Generation API (Single Shared Template Source of Truth) ----------

async function generateOfferLetterPdf(data) {
  const referenceId = data.referenceId || Date.now();
  const filename = `offer-${referenceId}.pdf`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const assets = loadDocumentAssets();
  const htmlContent = renderOfferLetterHtml(
    { ...data, assets },
    { mode: "print", bodyOnly: false }
  );

  const renderedByChrome = convertHtmlToPdfWithChrome(htmlContent, filepath);
  if (!renderedByChrome) {
    console.log("[DOC-GEN] Chrome headless unavailable, using aligned PDFKit fallback for offer letter");
    await generateOfferLetterPdfWithPdfKit(data, filepath);
  }

  return `/uploads/documents/${filename}`;
}

async function generateCertificatePdf(data) {
  const certificateId = data.certificateId || Date.now();
  const filename = `certificate-${certificateId}.pdf`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const assets = loadDocumentAssets();
  const htmlContent = renderCertificateHtml(
    { ...data, assets },
    { mode: "print", bodyOnly: false }
  );

  const renderedByChrome = convertHtmlToPdfWithChrome(htmlContent, filepath);
  if (!renderedByChrome) {
    console.log("[DOC-GEN] Chrome headless unavailable, using aligned PDFKit fallback for certificate");
    await generateCertificatePdfWithPdfKit(data, filepath);
  }

  return `/uploads/documents/${filename}`;
}

module.exports = {
  generateOfferLetterPdf,
  generateCertificatePdf,
  TEMPLATE_VERSION,
  findChromeExecutable,
};
