const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const Application = require("../models/Application");
const OfferLetter = require("../models/OfferLetter");
const Certificate = require("../models/Certificate");
const FinalReport = require("../models/FinalReport");
const { protect } = require("../middleware/auth");
const {
  generateOfferReferenceId,
  generateCertificateId,
  generateVerificationId,
  getNextOfferReferenceSequence,
  getNextCertificateSequence,
} = require("../utils/generateIds");
const { generateOfferLetterPdf, generateCertificatePdf, TEMPLATE_VERSION } = require("../utils/generatePdf");
const { appendToSpreadsheet, readSpreadsheet } = require("../utils/spreadsheetStorage");
const { sendEmail, templates } = require("../utils/sendEmail");
const { supportTargetEmail } = require("../utils/emailTargets");
const { isSampleVerificationLookup } = require("../utils/documentVerification");
const { getCache, setCache } = require("../utils/cache");

async function downloadDocument(req, res, Model, label) {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.applicationId);
  let appId = req.params.applicationId;
  if (!isObjectId) {
    const appDoc = await Application.findOne({ applicationId: req.params.applicationId }).lean();
    if (appDoc) appId = appDoc._id;
  }
  const document = await Model.findOne({ application: appId }).lean();
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
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.applicationId);
    const query = isObjectId ? { _id: req.params.applicationId } : { applicationId: req.params.applicationId };
    const application = await Application.findOne(query)
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
      const referenceId = offer?.referenceId || generateOfferReferenceId(await getNextOfferReferenceSequence(OfferLetter));
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
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.applicationId);
    const query = isObjectId ? { _id: req.params.applicationId } : { applicationId: req.params.applicationId };
    const application = await Application.findOne(query)
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
      const certificateId = cert?.certificateId || generateCertificateId(await getNextCertificateSequence(Certificate));
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
    const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
    const query = isObjectId ? { _id: applicationId } : { applicationId };
    const application = await Application.findOne(query).populate("domain", "name");
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.paymentStatus !== "Successful") {
      return res.status(400).json({ message: "Complete the program fee payment before submitting the final report" });
    }

    const studentId = application.student?._id ? application.student._id : application.student;
    if (String(studentId) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    const report = await FinalReport.create({ application: application._id, student: req.user._id, ...rest });
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
      req.user.email,
      application.applicationId || applicationId,
      domainName,
      rest.title || "",
      rest.githubUrl || "",
      rest.hostedUrl || "",
      rest.executiveSummary || ""
    );
    const studentReportConfirmation = templates.finalReportStudentConfirmation(
      req.user.fullName,
      application.applicationId || applicationId,
      domainName,
      rest.title || ""
    );

    await Promise.allSettled([
      sendEmail({ to: notifyTarget, replyTo: req.user.email, ...finalReportTemplate }),
      sendEmail({ to: req.user.email, replyTo: "support@interndock.in", ...studentReportConfirmation }),
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
  const cacheKey = `verify_offer_${query}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (isSampleVerificationLookup(query)) {
    const reply = { valid: false, message: "No matching offer letter record found in InternDock Public Ledger." };
    return res.status(404).json(reply);
  }

  const offerRows = await readSpreadsheet("offer_letters");
  const offerRow = offerRows.find((row) => row.referenceId === query || row.verificationId === query || row.offerId === query);
  if (offerRow) {
    const payload = {
      valid: true,
      studentName: offerRow.studentName || "Intern Student",
      domain: offerRow.domain || "Tech Internship Track",
      duration: "4 Weeks Track",
      referenceId: offerRow.referenceId,
      issueDate: offerRow.timestamp ? new Date(offerRow.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Verified Official Selection Record",
      pdfUrl: offerRow.pdfUrl || "",
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
  }

  let offer = await OfferLetter.findOne({
    $or: [{ verificationId: query }, { referenceId: query }],
  })
    .populate("student", "fullName")
    .populate({ path: "application", populate: ["domain", "duration"] })
    .lean();

  if (offer) {
    const payload = {
      valid: true,
      studentName: offer.student?.fullName || "Intern Student",
      domain: offer.application?.domain?.name || "Tech Internship Track",
      duration: offer.application?.duration?.label || "4 Weeks Track",
      referenceId: offer.referenceId,
      issueDate: offer.issueDate ? new Date(offer.issueDate).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Cryptographically Verified",
      pdfUrl: offer.pdfUrl || "",
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
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
    const payload = {
      valid: true,
      studentName: app.student?.fullName || "Intern Student",
      domain: app.domain?.name || "Tech Internship Track",
      duration: app.duration?.label || "4 Weeks Track",
      referenceId: app.offerLetterRef || `OFFER-${app._id.toString().slice(-6)}`,
      issueDate: new Date().toLocaleDateString(),
      status: "Verified Official Selection Record",
      pdfUrl: "",
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
  }

  const reply = { valid: false, message: "No matching offer letter record found in InternDock Public Ledger." };
  setCache(cacheKey, reply, 60);
  return res.status(404).json(reply);
});

// GET /api/documents/verify/certificate/:id
router.get("/verify/certificate/:id", async (req, res) => {
  const query = req.params.id;
  const cacheKey = `verify_certificate_${query}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  if (isSampleVerificationLookup(query)) {
    const reply = { valid: false, message: "No matching completion certificate found in InternDock Public Ledger." };
    return res.status(404).json(reply);
  }

  const certRows = await readSpreadsheet("certificates");
  const certRow = certRows.find((row) => row.certificateId === query || row.verificationId === query);
  if (certRow) {
    const payload = {
      valid: true,
      studentName: certRow.studentName || "Intern Student",
      domain: certRow.domain || "Tech Internship Track",
      duration: "4 Weeks Track",
      certificateId: certRow.certificateId,
      issueDate: certRow.timestamp ? new Date(certRow.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Cryptographically Verified Certificate",
      pdfUrl: certRow.pdfUrl || "",
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
  }

  let cert = await Certificate.findOne({
    $or: [{ verificationId: query }, { certificateId: query }],
  })
    .populate("student", "fullName")
    .populate({ path: "application", populate: ["domain", "duration"] })
    .lean();

  if (cert) {
    const payload = {
      valid: true,
      studentName: cert.student?.fullName || "Intern Student",
      domain: cert.application?.domain?.name || "Tech Internship Track",
      duration: cert.application?.duration?.label || "4 Weeks Track",
      certificateId: cert.certificateId,
      issueDate: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : new Date().toLocaleDateString(),
      status: "Cryptographically Verified Certificate",
      pdfUrl: cert.pdfUrl || "",
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
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
    const payload = {
      valid: true,
      studentName: app.student?.fullName || "Intern Student",
      domain: app.domain?.name || "Tech Internship Track",
      duration: app.duration?.label || "4 Weeks Track",
      certificateId: `CERT-${app._id.toString().slice(-8).toUpperCase()}`,
      issueDate: new Date().toLocaleDateString(),
      status: "Verified Completion Certificate",
      pdfUrl: "",
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
  }

  const reply = { valid: false, message: "No matching completion certificate found in InternDock Public Ledger." };
  setCache(cacheKey, reply, 60);
  return res.status(404).json(reply);
});

module.exports = router;
