const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Domain = require("../models/Domain");
const Duration = require("../models/Duration");
const { protect } = require("../middleware/auth");
const { generateApplicationId } = require("../utils/generateIds");
const { sendEmail, templates } = require("../utils/sendEmail");
const { appendToSpreadsheet } = require("../utils/spreadsheetStorage");

// POST /api/applications  — student applies to a domain + duration
router.post("/", protect, async (req, res) => {
  try {
    const { domainId, durationId } = req.body;
    const domain = await Domain.findById(domainId).lean();
    const duration = await Duration.findById(durationId).lean();
    if (!domain || !domain.isActive) return res.status(404).json({ message: "Domain not found" });
    if (!duration || !duration.isActive) return res.status(404).json({ message: "Duration not found" });

    const count = await Application.countDocuments();
    const applicationId = generateApplicationId(count + 1);

    const application = await Application.create({
      applicationId,
      student: req.user._id,
      domain: domain._id,
      duration: duration._id,
      status: "Submitted",
      statusHistory: [{ status: "Submitted", note: "Application submitted by student" }],
    });

    // Append application record to Spreadsheet CSV Ledger for hybrid storage & backup
    appendToSpreadsheet("applications", {
      applicationId,
      studentName: req.user.fullName,
      studentEmail: req.user.email,
      domainName: domain.name,
      durationWeeks: duration.weeks,
      fee: duration.fee,
      status: "Submitted",
    });

    const t = templates.applicationSubmitted(req.user.fullName, applicationId, domain.name);
    sendEmail({ to: req.user.email, ...t }).catch(() => {});

    return res.status(201).json(application);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/mine — all of the logged in student's applications
router.get("/mine", protect, async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate("domain")
    .populate("duration")
    .sort({ createdAt: -1 })
    .lean();
  return res.json(applications);
});

// GET /api/applications/:id — single application (must belong to the student, or be admin)
router.get("/:id", protect, async (req, res) => {
  const application = await Application.findById(req.params.id).populate("domain").populate("duration").populate("student", "fullName email college").lean();
  if (!application) return res.status(404).json({ message: "Not found" });
  if (String(application.student._id) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.json(application);
});

module.exports = router;
