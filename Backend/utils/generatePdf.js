const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const SIGNATURE_PATH = path.join(__dirname, "..", "assets", "ceo_signature.png");
const COMPANY_LOGO_PATH = path.join(__dirname, "..", "assets", "company_logo.png");
const SEAL_PATH = path.join(__dirname, "..", "assets", "official_seal.png");
const MSME_LOGO_PATH = path.join(__dirname, "..", "assets", "msme_logo.png");

const TEAL = "#0d9488";
const NAVY = "#0f172a";
const GOLD = "#c9962f";
const GRAY = "#64748b";

// Bump this any time the offer letter / certificate design changes below.
const TEMPLATE_VERSION = "2026-09-04-v4";

// Safe date formatter to prevent RangeError crashing on invalid dates
function formatDateSafe(val, fallback = "Immediate") {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch (err) {
    return fallback;
  }
}

// ---------- Shared decorative helpers ----------

function drawDottedBackground(doc, w, h, margin = 30, spacing = 16) {
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
  doc.lineWidth(1.4).strokeColor(color).rect(m, m, w - m * 2, h - m * 2).stroke();
  doc.lineWidth(0.7).strokeColor(color).rect(m + 5, m + 5, w - (m + 5) * 2, h - (m + 5) * 2).stroke();

  const hook = 16;
  const corners = [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1]
  ];
  doc.lineWidth(2.2).strokeColor(color);
  corners.forEach(([cx, cy, dx, dy]) => {
    doc.moveTo(cx, cy + dy * hook).lineTo(cx, cy).lineTo(cx + dx * hook, cy).stroke();
  });
  doc.restore();
}

// Dual Seals helper: Official Seal (Left) + Circular MSME Logo // Dual Seals helper: Official Certified Seal (Left) + Circular MSME Logo (Right)
function drawDualSeals(doc, cx, cy, size = 52) {
  const gap = 16;
  const totalW = size * 2 + gap;
  const startX = cx - totalW / 2;

  // 1. Official Certified Seal (Left) - Circular Clipped with Teal Border
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
    doc.lineWidth(1.4).strokeColor(TEAL).circle(sealCenterX, cy, size / 2).stroke();
    doc.restore();
  }

  // 2. Govt. MSME Circular Logo (Right) - Circular Clipped with Gold Border
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
    doc.lineWidth(1.4).strokeColor(GOLD).circle(msmeCenterX, cy, size / 2).stroke();
    doc.restore();
  }
}

function verifiedFooter(doc, w, bottomY) {
  const text = "InternDock Verified   |   www.interndock.in   |   Govt. Registered";
  doc.fontSize(9).font("Helvetica-Bold").fillColor(TEAL).text(text, 0, bottomY, { width: w, align: "center" });
}

// ---------- Offer Letter ----------

function generateOfferLetterPdf({ studentName = "Intern Student", collegeName = "-", domainName = "Tech Domain", durationLabel = "4 Weeks Track", startDate, endDate, applicationId, referenceId, verificationId, orgName }) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `offer-${referenceId || Date.now()}.pdf`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const doc = new PDFDocument({ size: "A4", margins: { top: 42, bottom: 20, left: 48, right: 48 } });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const w = doc.page.width;
      const h = doc.page.height;

      doc.rect(0, 0, w, h).fill("#fffdf8");
      drawDottedBackground(doc, w, h);
      drawFrame(doc, w, h);

      const issueDateStr = formatDateSafe(new Date(), "Today");
      const startStr = formatDateSafe(startDate, "Immediate");
      const endStr = formatDateSafe(endDate, "Upon Completion");

      let y = 40;

      if (fs.existsSync(COMPANY_LOGO_PATH)) {
        doc.image(COMPANY_LOGO_PATH, 46, y, { fit: [40, 40] });
      }
      doc.fontSize(17).font("Helvetica-Bold").fillColor(NAVY).text("InternDock", 94, y + 1);
      doc.fontSize(7.5).font("Helvetica").fillColor(GRAY).text("TECH TALENT PLATFORM", 94, y + 21, { characterSpacing: 1 });

      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text("support.interndock@gmail.com", 0, y + 2, { width: w - 46, align: "right" });
      doc.text("+91 8808307121", 0, y + 14, { width: w - 46, align: "right" });
      doc.text("Gorakhpur U.P. India", 0, y + 26, { width: w - 46, align: "right" });

      y += 50;
      doc.moveTo(46, y).lineTo(w - 46, y).lineWidth(0.75).strokeColor("#d6cfba").stroke();
      y += 14;

      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(`Reference: `, 46, y, { continued: true });
      doc.font("Helvetica-Bold").fillColor(NAVY).text(referenceId || "");
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(NAVY).text(issueDateStr, 0, y, { width: w - 46, align: "right" });

      y += 28;
      doc.fontSize(24).font("Times-Bold").fillColor(NAVY).text("Internship Offer Letter", 46, y, { width: w - 92, align: "center" });
      y += 32;
      doc.moveTo(w / 2 - 90, y).lineTo(w / 2 + 90, y).lineWidth(1.5).strokeColor(TEAL).stroke();
      y += 22;

      doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY).text(`Dear ${studentName},`, 46, y);
      y += 22;

      doc.fontSize(10.5).font("Helvetica").fillColor("#334155").text(
        `We are delighted to welcome you to the Internship Program at `, 46, y, { continued: true, width: w - 92, lineGap: 4 }
      );
      doc.font("Helvetica-Bold").fillColor(NAVY).text("InternDock", { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(". We believe your skills and enthusiasm will be a valuable asset to our team.");
      y = doc.y + 16;

      doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("INTERNSHIP DETAILS", 46, y, { characterSpacing: 0.8 });
      y += 18;
      doc.moveTo(46, y).lineTo(w - 46, y).lineWidth(0.6).strokeColor("#d6cfba").stroke();
      y += 10;

      const rows = [
        ["College / University", collegeName || "-"],
        ["Role", `${domainName} Intern`],
        ["Start Date", startStr],
        ["End Date", endStr],
        ["Type", "Project-Based / Remote"],
        ["Duration", durationLabel]
      ];
      rows.forEach(([label, value]) => {
        doc.fontSize(10).font("Helvetica").fillColor(GRAY).text(label, 46, y, { width: 150 });
        doc.fontSize(10).font("Helvetica-BoldOblique").fillColor(NAVY).text(value, 220, y, { width: w - 220 - 46 });
        y += 20;
        doc.moveTo(46, y - 4).lineTo(w - 46, y - 4).lineWidth(0.4).strokeColor("#ece5d3").stroke();
      });

      y += 10;
      doc.fontSize(10.5).font("Helvetica").fillColor("#334155").text(
        "During this period, you will have the opportunity to work on real-world projects and gain hands-on experience under mentor guidance. Upon successful completion of the internship, you will be awarded an official Internship Completion Certificate.",
        46, y, { width: w - 92, align: "justify", lineGap: 4 }
      );
      y = doc.y + 14;

      doc.fontSize(10.5).font("Helvetica").fillColor("#334155").text(
        "We look forward to a productive and meaningful association with you.", 46, y, { width: w - 92 }
      );
      y = doc.y + 16;

      doc.fontSize(11).font("Helvetica-Bold").fillColor(NAVY).text("Best regards,", 46, y);

      // ---- Bottom block ----
      const btmY = h - 118;

      doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("APPLICATION ID", 46, btmY, { characterSpacing: 0.6 });
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text(applicationId || "", 46, btmY + 12);

      drawDualSeals(doc, w / 2, btmY + 20, 52);

      const sigX = w - 200;
      doc.moveTo(sigX, btmY + 26).lineTo(sigX + 154, btmY + 26).lineWidth(1).strokeColor(GRAY).stroke();
      if (fs.existsSync(SIGNATURE_PATH)) {
        doc.image(SIGNATURE_PATH, sigX + 12, btmY - 20, { fit: [130, 52] });
      }
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text("Aman Mishra", sigX, btmY + 32, { width: 154, align: "center" });
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY).text("Founder & CEO, InternDock", sigX, btmY + 45, { width: 154, align: "center" });

      verifiedFooter(doc, w, h - 42);

      doc.end();
      stream.on("finish", () => resolve(`/uploads/documents/${filename}`));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ---------- Certificate ----------

function generateCertificatePdf({ studentName = "Intern Student", collegeName = "-", domainName = "Tech Domain", durationLabel = "4 Weeks Track", startDate, endDate, certificateId, verificationId, orgName }) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `certificate-${certificateId || Date.now()}.pdf`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 36, bottom: 18, left: 40, right: 40 } });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const w = doc.page.width;
      const h = doc.page.height;

      doc.rect(0, 0, w, h).fill("#fffdf8");
      drawDottedBackground(doc, w, h);
      drawFrame(doc, w, h);

      const startStr = formatDateSafe(startDate, "Start Date");
      const endStr = formatDateSafe(endDate, "End Date");
      const issueDateStr = formatDateSafe(new Date(), "Today");

      let y = 36;

      if (fs.existsSync(COMPANY_LOGO_PATH)) {
        doc.image(COMPANY_LOGO_PATH, 46, y, { fit: [38, 38] });
      }
      doc.fontSize(16).font("Helvetica-Bold").fillColor(NAVY).text("InternDock", 92, y + 1);
      doc.fontSize(7.5).font("Helvetica").fillColor(GRAY).text("TECH TALENT PLATFORM", 92, y + 20, { characterSpacing: 1 });

      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(`Certificate ID: `, 0, y, { width: w - 92, align: "right" });
      doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY).text(certificateId || "", 0, y + 10, { width: w - 92, align: "right" });
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(`Issued: ${issueDateStr}`, 0, y + 24, { width: w - 92, align: "right" });

      y += 44;
      doc.moveTo(46, y).lineTo(w - 46, y).lineWidth(0.75).strokeColor("#d6cfba").stroke();
      y += 22;

      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(TEAL).text("CERTIFICATE OF INTERNSHIP", 0, y, { align: "center", characterSpacing: 2.5 });
      y += 20;

      doc.fontSize(30).font("Times-Bold").fillColor(NAVY).text("Certificate of Completion", 0, y, { align: "center" });
      y += 46;

      doc.fontSize(11).font("Helvetica").fillColor(GRAY).text("This certifies that", 0, y, { align: "center" });
      y += 20;

      doc.fontSize(26).font("Times-BoldItalic").fillColor(NAVY).text(studentName, 0, y, { align: "center" });
      y = doc.y + 6;
      doc.moveTo(w / 2 - 130, y).lineTo(w / 2 + 130, y).lineWidth(0.75).strokeColor("#c9c2ac").stroke();
      y += 18;

      const bodyLine1 = `student of ${collegeName || "-"}, has successfully completed an internship`;
      const bodyLine2 = `in the field of ${domainName},`;
      const bodyLine3 = `contributing to real-world projects from ${startStr} to ${endStr} under the guidance of InternDock.`;
      doc.fontSize(14).font("Helvetica").fillColor("#334155");
      doc.text(bodyLine1, 60, y, { width: w - 120, align: "center" });
      y = doc.y + 7;
      doc.text(bodyLine2, 60, y, { width: w - 120, align: "center" });
      y = doc.y + 7;
      doc.text(bodyLine3, 60, y, { width: w - 120, align: "center" });

      // ---- Bottom block ----
      const btmY = h - 125;

      doc.fontSize(8).font("Helvetica").fillColor(GRAY).text("REFERENCE", 55, btmY, { characterSpacing: 0.6 });
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text(certificateId || "", 55, btmY + 12);

      drawDualSeals(doc, w / 2, btmY + 18, 56);

      const sigX = w - 210;
      doc.moveTo(sigX, btmY + 28).lineTo(sigX + 160, btmY + 28).lineWidth(1).strokeColor(GRAY).stroke();
      if (fs.existsSync(SIGNATURE_PATH)) {
        doc.image(SIGNATURE_PATH, sigX + 14, btmY - 20, { fit: [135, 54] });
      }
      doc.fontSize(11).font("Helvetica-Bold").fillColor(NAVY).text("Aman Mishra", sigX, btmY + 34, { width: 160, align: "center" });
      doc.fontSize(8.5).font("Helvetica").fillColor(GRAY).text("Founder & CEO, InternDock", sigX, btmY + 47, { width: 160, align: "center" });

      verifiedFooter(doc, w, h - 34);

      doc.end();
      stream.on("finish", () => resolve(`/uploads/documents/${filename}`));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOfferLetterPdf, generateCertificatePdf, TEMPLATE_VERSION };
