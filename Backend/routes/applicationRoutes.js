const express = require("express");
const router = express.Router();
const Domain = require("../models/Domain");
const Duration = require("../models/Duration");
const Application = require("../models/Application");
const { protect } = require("../middleware/auth");
const { generateApplicationId } = require("../utils/generateIds");
const { sendEmail, templates } = require("../utils/sendEmail");
const { appendToSpreadsheet, readSpreadsheet } = require("../utils/spreadsheetStorage");

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
    const applicationId = generateApplicationId(ledgerRows.length + 1);

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

    const applicationDoc = await Application.create({
      applicationId,
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

    appendToSpreadsheet("applications", ledgerRow);

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

    // Prepare and dispatch emails (student confirmation + support@interndock.in admin notification)
    const adminNotificationEmail = (process.env.NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || "support@interndock.in")
      .split(",")
      .map((val) => val.trim())
      .filter(Boolean)
      .join(",");
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
      sendEmail({ to: req.user.email, ...studentT }),
      sendEmail({ to: adminNotificationEmail, ...adminT })
    ]);

    return res.status(201).json(application);

  } catch (err) {
    console.error("Application creation error:", err);
    return res.status(500).json({ message: "Unable to submit the application." });
  }
});

router.get("/mine", protect, async (req, res) => {
  const rows = await readSpreadsheet("applications");
  const applications = rowsToApplications(rows.filter((row) => row.studentEmail === req.user.email || row.studentId === String(req.user._id)));
  return res.json(applications);
});

router.get("/:id", protect, async (req, res) => {
  const rows = await readSpreadsheet("applications");
  const row = rows.find((r) => r.applicationId === req.params.id || r._id === req.params.id);
  if (!row) return res.status(404).json({ message: "Not found" });

  if (String(row.studentId) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(rowsToApplications([row])[0]);
});

module.exports = router;
