const express = require("express");
const router = express.Router();
const Domain = require("../models/Domain");
const Duration = require("../models/Duration");
const Application = require("../models/Application");
const { protect } = require("../middleware/auth");
const { generateApplicationId, generateApplicationIdFromCounts, getNextApplicationSequence } = require("../utils/generateIds");
const { sendEmail, templates } = require("../utils/sendEmail");
const { appendToSpreadsheet, readSpreadsheet } = require("../utils/spreadsheetStorage");
const { supportTargetEmail } = require("../utils/emailTargets");

function serializeApplication(application) {
  if (!application) return null;

  return {
    _id: application._id,
    applicationId: application.applicationId,
    student: {
      _id: application.student?._id || application.student,
      fullName: application.student?.fullName || "",
      email: application.student?.email || "",
    },
    domain: { _id: application.domain?._id || application.domain, name: application.domain?.name || "" },
    duration: {
      _id: application.duration?._id || application.duration,
      label: application.duration?.label || `${application.duration?.weeks || 4} Weeks Track`,
      weeks: application.duration?.weeks || 4,
      fee: application.duration?.fee || 0,
    },
    status: application.status,
    paymentStatus: application.paymentStatus,
    startDate: application.startDate,
    endDate: application.endDate,
    certificateIssued: application.certificateIssued,
    finalReportSubmitted: application.finalReportSubmitted,
    statusHistory: application.statusHistory,
    createdAt: application.createdAt,
  };
}

function rowsToApplications(rows) {
  return rows
    .map((row) => ({
      _id: row.applicationId || row._id || row.applicationInternalId,
      id: row.applicationId || row._id,
      applicationId: row.applicationId || row._id,
      student: { _id: row.studentId || row.studentEmail, email: row.studentEmail, fullName: row.studentName },
      domain: { _id: row.domainId || row.domainName, name: row.domainName },
      duration: { _id: row.durationId || row.durationWeeks, label: `${row.durationWeeks || 4} Weeks Track`, weeks: Number(row.durationWeeks || 4), fee: Number(row.fee || 0) },
      status: row.status || "Submitted",
      startDate: row.startDate || row.start_date,
      endDate: row.endDate || row.end_date,
      paymentStatus: row.paymentStatus || "Pending",
      certificateIssued: Boolean(row.certificateIssued),
      finalReportSubmitted: Boolean(row.finalReportSubmitted),
      createdAt: row.timestamp || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// POST /api/applications  — student applies to a domain + duration
router.post("/", protect, async (req, res) => {
  try {
    const { domainId, durationId, startDate, endDate } = req.body;
    const domain = await Domain.findById(domainId).lean();
    const duration = await Duration.findById(durationId).lean();
    if (!domain || !domain.isActive) return res.status(404).json({ message: "Domain not found" });
    if (!duration || !duration.isActive) return res.status(404).json({ message: "Duration not found" });

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (!startDate || !endDate || Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime()) || parsedEndDate <= parsedStartDate) {
      return res.status(400).json({ message: "Choose a valid internship start and end date" });
    }

    const ledgerRows = readSpreadsheet("applications");
    let candidateSeq = await getNextApplicationSequence(Application, ledgerRows);

    let applicationDoc;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const candidateId = generateApplicationId(candidateSeq);
      try {
        applicationDoc = await Application.create({
          applicationId: candidateId,
          student: req.user._id,
          domain: domain._id,
          duration: duration._id,
          status: "Submitted",
          statusHistory: [{ status: "Submitted", note: "Application submitted by student" }],
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          paymentStatus: "Pending",
          finalReportSubmitted: false,
          certificateIssued: false,
        });
        break;
      } catch (err) {
        const isDuplicateKey = err?.code === 11000 || (err?.message && err.message.includes("E11000"));
        if (isDuplicateKey) {
          candidateSeq++;
          attempts++;
        } else {
          throw err;
        }
      }
    }

    if (!applicationDoc) {
      throw new Error("Unable to allocate a unique Application ID after multiple attempts.");
    }

    const applicationId = applicationDoc.applicationId;

    const ledgerRow = {
      applicationId,
      studentId: String(req.user._id),
      studentName: req.user.fullName,
      studentEmail: req.user.email,
      domainId: String(domain._id),
      domainName: domain.name,
      durationId: String(duration._id),
      durationWeeks: duration.weeks,
      startDate: parsedStartDate.toISOString().slice(0, 10),
      endDate: parsedEndDate.toISOString().slice(0, 10),
      fee: duration.fee,
      paymentStatus: "Pending",
      status: "Submitted",
      statusHistory: "Submitted",
    };

    try {
      await appendToSpreadsheet("applications", { ...ledgerRow, applicationId: applicationDoc.applicationId });
    } catch (err) {
      console.warn("Application ledger append failed after application was created:", err.message);
    }

    const application = {
      _id: applicationDoc._id,
      applicationId,
      student: { _id: req.user._id, fullName: req.user.fullName, email: req.user.email },
      domain: { _id: domain._id, name: domain.name },
      duration: { _id: duration._id, weeks: duration.weeks, fee: duration.fee, label: duration.label },
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      status: "Submitted",
      paymentStatus: "Pending",
      statusHistory: [{ status: "Submitted", note: "Application submitted by student" }],
    };

    // Prepare and dispatch emails (student confirmation + configured support inbox)
    const adminNotificationEmail = supportTargetEmail();
    const studentT = templates.applicationSubmitted(req.user.fullName, applicationId, domain.name);
    const adminT = templates.newApplicationAdminNotification(
      req.user.fullName,
      req.user.email,
      domain.name,
      duration.weeks,
      applicationId,
      parsedStartDate.toISOString().slice(0, 10),
      parsedEndDate.toISOString().slice(0, 10)
    );

    await Promise.allSettled([
      sendEmail({ to: req.user.email, replyTo: "support@interndock.in", ...studentT }),
      sendEmail({ to: adminNotificationEmail, replyTo: req.user.email, ...adminT })
    ]);

    return res.status(201).json(application);

  } catch (err) {
    console.error("Application creation error:", err);
    return res.status(500).json({ message: "Unable to submit the application." });
  }
});

router.get("/mine", protect, async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate("domain", "name")
    .populate("duration", "label weeks fee")
    .populate("student", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

  return res.json(applications.map((app) => serializeApplication(app)));
});

router.get("/:id", protect, async (req, res) => {
  const app = await Application.findOne({
    $or: [
      { _id: req.params.id },
      { applicationId: req.params.id },
    ],
  })
    .populate("student", "fullName email college")
    .populate("domain", "name")
    .populate("duration", "label weeks fee")
    .lean();

  if (!app) return res.status(404).json({ message: "Not found" });

  if (String(app.student?._id || app.student) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(serializeApplication(app));
});

module.exports = router;
