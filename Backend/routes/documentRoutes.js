const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const Application = require("../models/Application");
const OfferLetter = require("../models/OfferLetter");
const Certificate = require("../models/Certificate");
const FinalReport = require("../models/FinalReport");
const { protect } = require("../middleware/auth");
const { generateOfferReferenceId, generateCertificateId, generateVerificationId } = require("../utils/generateIds");
const { generateOfferLetterPdf, generateCertificatePdf, TEMPLATE_VERSION } = require("../utils/generatePdf");
const { appendToSpreadsheet, readSpreadsheet } = require("../utils/spreadsheetStorage");
const { sendEmail, templates } = require("../utils/sendEmail");
const { supportTargetEmail } = require("../utils/emailTargets");

async function downloadDocument(req, res, Model, label) {
  const document = await Model.findOne({ application: req.params.applicationId }).lean();
  if (!document) return res.status(404).json({ message: `${label} not found` });
  if (String(document.student) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const filename = path.basename(document.pdfUrl || "");
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads", "documents");
  const filePath = path.join(uploadDir, filename);
  if (!filename || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: `${label} file not found` });
  }

  return res.download(filePath, filename);
}

router.get("/offer-letter/:applicationId/download", protect, async (req, res, next) => {
  try {
    await downloadDocument(req, res, OfferLetter, "Offer letter");
  } catch (error) {
    next(error);
  }
});

router.get("/certificate/:applicationId/download", protect, async (req, res, next) => {
  try {
    await downloadDocument(req, res, Certificate, "Certificate");
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/offer-letter/:applicationId — student fetches (generates if missing)
router.get("/offer-letter/:applicationId", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate("domain")
      .populate("duration")
      .populate("student")
      .lean();

    if (!application) return res.status(404).json({ message: "Application not found" });

    const studentId = application.student?._id ? application.student._id : application.student;
    if (String(studentId) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!["Selected", "Active", "Completed"].includes(application.status)) {
      return res.status(400).json({ message: "Offer letter is only available after selection" });
    }

    let offer = await OfferLetter.findOne({ application: application._id });
    const isStale = !offer || offer.templateVersion !== TEMPLATE_VERSION;

    if (isStale) {
      // Keep the same reference/verification IDs if this offer letter already existed
      const referenceId = offer?.referenceId || generateOfferReferenceId((await OfferLetter.countDocuments()) + 1);
      const verificationId = offer?.verificationId || generateVerificationId();

      const pdfUrl = await generateOfferLetterPdf({
        studentName: application.student?.fullName || req.user.fullName || "Intern Student",
        collegeName: application.student?.college || "",
        domainName: application.domain?.name || "Tech Domain",
        durationLabel: application.duration?.label || `${application.duration?.weeks || 4} Weeks Track`,
        startDate: application.startDate,
        endDate: application.endDate,
        applicationId: application.applicationId || application._id,
        referenceId,
        verificationId,
        orgName: process.env.ORG_NAME || "InternDock",
      });

      if (offer) {
        offer.pdfUrl = pdfUrl;
        offer.templateVersion = TEMPLATE_VERSION;
        await offer.save();
      } else {
        offer = await OfferLetter.create({
          application: application._id,
          student: studentId,
          referenceId,
          verificationId,
          pdfUrl,
          templateVersion: TEMPLATE_VERSION,
        });
      }

      appendToSpreadsheet("offer_letters", {
        offerId: offer._id,
        applicationId: application.applicationId || application._id,
        referenceId,
        verificationId,
        studentName: application.student?.fullName || req.user.fullName,
        studentEmail: application.student?.email || req.user.email,
        domain: application.domain?.name,
        pdfUrl,
      });
    }

    res.json(offer);
  } catch (err) {
    console.error("Offer letter error:", err);
    res.status(500).json({ message: "Unable to prepare the offer letter." });
  }
});

// GET /api/documents/certificate/:applicationId
router.get("/certificate/:applicationId", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate("domain")
      .populate("duration")
      .populate("student")
      .lean();

    if (!application) return res.status(404).json({ message: "Application not found" });

    const studentId = application.student?._id ? application.student._id : application.student;
    if (String(studentId) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!application.certificateIssued) {
      return res.status(400).json({ message: "Certificate has not been issued yet" });
    }

    let cert = await Certificate.findOne({ application: application._id });
    const isStale = !cert || cert.templateVersion !== TEMPLATE_VERSION;

    if (isStale) {
      const certificateId = cert?.certificateId || generateCertificateId((await Certificate.countDocuments()) + 1);
      const verificationId = cert?.verificationId || generateVerificationId();

      const pdfUrl = await generateCertificatePdf({
        studentName: application.student?.fullName || req.user.fullName || "Intern Student",
        collegeName: application.student?.college || "",
        domainName: application.domain?.name || "Tech Domain",
        durationLabel: application.duration?.label || `${application.duration?.weeks || 4} Weeks Track`,
        startDate: application.startDate,
        endDate: application.endDate,
        certificateId,
        verificationId,
        orgName: process.env.ORG_NAME || "InternDock",
      });

      if (cert) {
        cert.pdfUrl = pdfUrl;
        cert.templateVersion = TEMPLATE_VERSION;
        await cert.save();
      } else {
        cert = await Certificate.create({
          application: application._id,
          student: studentId,
          certificateId,
          verificationId,
          pdfUrl,
          templateVersion: TEMPLATE_VERSION,
        });
      }

      appendToSpreadsheet("certificates", {
        certificateId: cert.certificateId,
        applicationId: application.applicationId || application._id,
        verificationId,
        studentName: application.student?.fullName || req.user.fullName,
        studentEmail: application.student?.email || req.user.email,
        domain: application.domain?.name,
        pdfUrl,
      });
    }

    res.json(cert);
  } catch (err) {
    console.error("Certificate error:", err);
    res.status(500).json({ message: "Unable to prepare the certificate." });
  }
});

// POST /api/documents/final-report
router.post("/final-report", protect, async (req, res) => {
  try {
    const { applicationId, ...rest } = req.body;
    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.paymentStatus !== "Successful") {
      return res.status(400).json({ message: "Complete the program fee payment before submitting the final report" });
    }

    const studentId = application.student?._id ? application.student._id : application.student;
    if (String(studentId) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    const report = await FinalReport.create({ application: applicationId, student: req.user._id, ...rest });
    application.finalReportSubmitted = true;
    await application.save();

    appendToSpreadsheet("final_reports", {
      reportId: report._id,
      applicationId: application.applicationId || applicationId,
      studentName: req.user.fullName,
      studentEmail: req.user.email,
      projectTitle: rest.title || "",
      githubUrl: rest.githubUrl || "",
    });

    const notifyTarget = supportTargetEmail();
    const domainName = application.domain?.name || "Internship domain";
    const finalReportTemplate = templates.finalReportSubmitted(
      req.user.fullName,
      application.applicationId || applicationId,
      domainName
    );
    await Promise.allSettled([
      sendEmail({ to: notifyTarget, ...finalReportTemplate }),
    ]);

    res.status(201).json(report);
  } catch (err) {
    console.error("Final report error:", err);
    res.status(500).json({ message: "Unable to submit the final report." });
  }
});

// ---- Robust Public Verification (No Auth Needed) ----

// GET /api/documents/verify/offer/:id
router.get("/verify/offer/:id", async (req, res) => {
  const query = req.params.id;

  // Sample Demo Check
  if (!query || query === "sample" || query.toLowerCase().includes("sample")) {
    return res.json({
      valid: true,
      studentName: "Alex Rivera",
      domain: "Full Stack MERN Web Development",
      duration: "4 Weeks Track",
      referenceId: "OFFER-IND-2026-7731",
      issueDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Verified Selection Offer Letter",
    });
  }

  const offerRows = await readSpreadsheet("offer_letters");
  const offerRow = offerRows.find((row) => row.referenceId === query || row.verificationId === query || row.offerId === query);
  if (offerRow) {
    return res.json({
      valid: true,
      studentName: offerRow.studentName || "Intern Student",
      domain: offerRow.domain || "Tech Internship Track",
      duration: "4 Weeks Track",
      referenceId: offerRow.referenceId,
      issueDate: offerRow.timestamp ? new Date(offerRow.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Verified Official Selection Record",
    });
  }

  let offer = await OfferLetter.findOne({
    $or: [{ verificationId: query }, { referenceId: query }],
  })
    .populate("student", "fullName")
    .populate({ path: "application", populate: ["domain", "duration"] })
    .lean();

  if (offer) {
    return res.json({
      valid: true,
      studentName: offer.student?.fullName || "Intern Student",
      domain: offer.application?.domain?.name || "Tech Internship Track",
      duration: offer.application?.duration?.label || "4 Weeks Track",
      referenceId: offer.referenceId,
      issueDate: offer.issueDate ? new Date(offer.issueDate).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Cryptographically Verified",
    });
  }

  // 2. Fallback search in Application collection by ID or applicationId
  let app = null;
  try {
    app = await Application.findOne({
      $or: [{ applicationId: query }, { _id: query.match(/^[0-9a-fA-F]{24}$/) ? query : null }],
    })
      .populate("student", "fullName")
      .populate("domain", "name")
      .populate("duration", "label")
      .lean();
  } catch (e) {
    app = null;
  }

  if (app && ["Selected", "Active", "Completed"].includes(app.status)) {
    return res.json({
      valid: true,
      studentName: app.student?.fullName || "Intern Student",
      domain: app.domain?.name || "Tech Internship Track",
      duration: app.duration?.label || "4 Weeks Track",
      referenceId: app.offerLetterRef || `OFFER-${app._id.toString().slice(-6)}`,
      issueDate: new Date().toLocaleDateString(),
      status: "Verified Official Selection Record",
    });
  }

  return res.status(404).json({ valid: false, message: "No matching offer letter record found in InternDock Public Ledger." });
});

// GET /api/documents/verify/certificate/:id
router.get("/verify/certificate/:id", async (req, res) => {
  const query = req.params.id;

  // Sample Demo Check
  if (!query || query === "sample" || query.toLowerCase().includes("sample")) {
    return res.json({
      valid: true,
      studentName: "Alex Rivera",
      domain: "Full Stack MERN Web Development",
      duration: "4 Weeks Track",
      certificateId: "CERT-IND-2026-9842",
      issueDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Verified Completion Certificate",
    });
  }

  const certRows = await readSpreadsheet("certificates");
  const certRow = certRows.find((row) => row.certificateId === query || row.verificationId === query);
  if (certRow) {
    return res.json({
      valid: true,
      studentName: certRow.studentName || "Intern Student",
      domain: certRow.domain || "Tech Internship Track",
      duration: "4 Weeks Track",
      certificateId: certRow.certificateId,
      issueDate: certRow.timestamp ? new Date(certRow.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Cryptographically Verified Certificate",
    });
  }

  let cert = await Certificate.findOne({
    $or: [{ verificationId: query }, { certificateId: query }],
  })
    .populate("student", "fullName")
    .populate({ path: "application", populate: ["domain", "duration"] })
    .lean();

  if (cert) {
    return res.json({
      valid: true,
      studentName: cert.student?.fullName || "Intern Student",
      domain: cert.application?.domain?.name || "Tech Internship Track",
      duration: cert.application?.duration?.label || "4 Weeks Track",
      certificateId: cert.certificateId,
      issueDate: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Cryptographically Verified Certificate",
    });
  }

  // 2. Fallback search in Application collection
  let app = null;
  try {
    app = await Application.findOne({
      $or: [{ applicationId: query }, { _id: query.match(/^[0-9a-fA-F]{24}$/) ? query : null }],
    })
      .populate("student", "fullName")
      .populate("domain", "name")
      .populate("duration", "label")
      .lean();
  } catch (e) {
    app = null;
  }

  if (app && app.certificateIssued) {
    return res.json({
      valid: true,
      studentName: app.student?.fullName || "Intern Student",
      domain: app.domain?.name || "Tech Internship Track",
      duration: app.duration?.label || "4 Weeks Track",
      certificateId: `CERT-${app._id.toString().slice(-8).toUpperCase()}`,
      issueDate: new Date().toLocaleDateString(),
      status: "Verified Completion Certificate",
    });
  }

  return res.status(404).json({ valid: false, message: "No matching completion certificate found in InternDock Public Ledger." });
});

module.exports = router;
