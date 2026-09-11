const express = require("express");
const fs = require("fs");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");

const Domain = require("../models/Domain");
const Duration = require("../models/Duration");
const Application = require("../models/Application");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Certificate = require("../models/Certificate");
const { generateCertificateId, generateVerificationId, getNextCertificateSequence } = require("../utils/generateIds");
const { generateCertificatePdf } = require("../utils/generatePdf");
const { sendEmail, templates, getEmailLog } = require("../utils/sendEmail");
const { getSpreadsheetPath, ALLOWED_SHEETS } = require("../utils/spreadsheetStorage");
const { canIssueCertificate, getRequiredTaskCount } = require("../utils/certificateEligibility");
const Submission = require("../models/Submission");
const { clearCache } = require("../utils/cache");

router.use(protect, adminOnly);

// Download a local CSV ledger backup. This is intentionally admin-only.
router.get("/ledgers/:sheetName", (req, res) => {
  const { sheetName } = req.params;
  if (!ALLOWED_SHEETS.has(sheetName)) return res.status(404).json({ message: "Ledger not found" });

  const filePath = getSpreadsheetPath(sheetName);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: "This ledger has not been created yet" });
  }

  return res.download(filePath, `${sheetName}.csv`);
});

// ---- Dashboard overview ----
router.get("/stats", async (req, res) => {
  const [totalStudents, totalApplications, selected, active, completed, revenueAgg, certificatesIssued] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Application.countDocuments(),
    Application.countDocuments({ status: "Selected" }),
    Application.countDocuments({ status: "Active" }),
    Application.countDocuments({ status: "Completed" }),
    Payment.aggregate([{ $match: { status: "Successful" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Application.countDocuments({ certificateIssued: true }),
  ]);

  res.json({
    totalStudents,
    totalApplications,
    selected,
    active,
    completed,
    revenue: revenueAgg[0]?.total || 0,
    certificatesIssued,
  });
});

// ---- Domain CRUD ----
router.get("/domains", async (req, res) => {
  const domains = await Domain.find().populate("availableDurations").sort({ createdAt: -1 });
  res.json(domains);
});

router.post("/domains", async (req, res) => {
  try {
    const durationDocs = await Duration.find({});
    const domainData = {
      ...req.body,
      availableDurations: req.body.availableDurations?.length ? req.body.availableDurations : durationDocs.map((d) => d._id),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    };
    const domain = await Domain.create(domainData);

    const baseAssignments = [
      { week: 1, title: "Week 1: Setup & Project Roadmap", description: `Initialize ${domain.name} environment and task plan.`, instructions: "1. Install development tools.\n2. Create project repository.\n3. Verify initial execution.\n4. Submit GitHub repo link below.", submissionType: "github" },
      { week: 2, title: "Week 2: Core Foundations", description: `Implement foundational components and syntax for ${domain.name}.`, instructions: "1. Implement core features.\n2. Write unit tests or test inputs.\n3. Commit changes.\n4. Submit GitHub repo link below.", submissionType: "github" },
      { week: 3, title: "Week 3: Applied Feature Module", description: `Build practical working module for ${domain.name}.`, instructions: "1. Integrate application components.\n2. Add error handling and documentation.\n3. Commit to GitHub.\n4. Submit repo link below.", submissionType: "github" },
      { week: 4, title: "Week 4: Capstone & Final Evaluation", description: `Complete capstone project and prepare demo for ${domain.name}.`, instructions: "1. Polish code and UI.\n2. Write comprehensive documentation.\n3. Prepare deployment or demo URL.\n4. Submit final repository link below.", submissionType: "github" },
    ];

    const full24 = [];
    for (let w = 1; w <= 24; w++) {
      const base = baseAssignments[(w - 1) % baseAssignments.length];
      full24.push({
        ...base,
        week: w,
        title: `Week ${w}: ${base.title.replace(/^Week \d+:\s*/, "")}`,
        domain: domain._id,
      });
    }

    await Assignment.insertMany(full24);
    clearCache();

    res.status(201).json(domain);
  } catch (err) {
    console.error("Admin create domain error:", err);
    res.status(500).json({ message: err.message || "Failed to create domain" });
  }
});

router.put("/domains/:id", async (req, res) => {
  const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!domain) return res.status(404).json({ message: "Not found" });
  clearCache();
  res.json(domain);
});

router.delete("/domains/:id", async (req, res) => {
  const domain = await Domain.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  clearCache();
  res.json(domain);
});

// ---- Duration / pricing CRUD ----
router.get("/durations", async (req, res) => {
  res.json(await Duration.find().sort({ weeks: 1 }));
});

router.post("/durations", async (req, res) => {
  const duration = await Duration.create(req.body);
  res.status(201).json(duration);
});

router.put("/durations/:id", async (req, res) => {
  const duration = await Duration.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(duration);
});

router.delete("/durations/:id", async (req, res) => {
  const duration = await Duration.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json(duration);
});

// ---- Curriculum / assignments CRUD ----
router.get("/assignments", async (req, res) => {
  const filter = {};
  if (req.query.domain) filter.domain = req.query.domain;
  res.json(await Assignment.find(filter).populate("domain").sort({ week: 1 }));
});

router.post("/assignments", async (req, res) => {
  const assignment = await Assignment.create(req.body);
  res.status(201).json(assignment);
});

router.put("/assignments/:id", async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(assignment);
});

router.delete("/assignments/:id", async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ---- Application management with payment details ----
router.get("/applications", async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.domain) filter.domain = req.query.domain;
  if (req.query.duration) filter.duration = req.query.duration;
  if (req.query.search) filter.applicationId = { $regex: req.query.search, $options: "i" };

  const [applications, payments] = await Promise.all([
    Application.find(filter)
      .populate("student", "fullName email phone college")
      .populate("domain", "name")
      .populate("duration", "label weeks fee")
      .sort({ createdAt: -1 }),
    Payment.find().lean(),
  ]);

  const paymentMap = {};
  payments.forEach((p) => {
    if (p.application) {
      paymentMap[p.application.toString()] = p;
    }
  });

  const enriched = applications.map((app) => {
    const p = paymentMap[app._id.toString()];
    return {
      ...app.toObject(),
      paymentDetails: p
        ? {
            utrNumber: p.utrNumber || p.paymentId || "N/A",
            payerName: p.payerName || app.student?.fullName,
            registeredEmail: p.registeredEmail || app.student?.email,
            amount: p.amount || app.duration?.fee || 100,
            status: p.status,
            createdAt: p.createdAt,
          }
        : null,
    };
  });

  res.json(enriched);
});

// Change application status
router.put("/applications/:id/status", async (req, res) => {
  const { status, note, paymentStatus } = req.body;
  const application = await Application.findById(req.params.id).populate("domain").populate("student");
  if (!application) return res.status(404).json({ message: "Not found" });

  application.status = status;
  if (paymentStatus) application.paymentStatus = paymentStatus;
  application.statusHistory.push({ status, note });

  if ((status === "Active" || status === "Selected") && !application.startDate) {
    application.startDate = new Date();
    const durationDoc = await Duration.findById(application.duration);
    const end = new Date();
    end.setDate(end.getDate() + (durationDoc?.weeks || 4) * 7);
    application.endDate = end;
  }

  await application.save();

  if (status === "Selected" || status === "Active") {
    const t = templates.selected(application.student.fullName, application.domain.name);
    await sendEmail({ to: application.student.email, ...t }).catch(() => {});
  } else if (status === "Rejected") {
    const t = templates.rejected(application.student.fullName, application.domain.name);
    await sendEmail({ to: application.student.email, ...t }).catch(() => {});
  }

  res.json(application);
});

// Admin 1-click Mark Payment Paid & Activate
router.put("/applications/:id/mark-payment", async (req, res) => {
  const application = await Application.findById(req.params.id).populate("domain").populate("student");
  if (!application) return res.status(404).json({ message: "Not found" });

  application.paymentStatus = "Successful";
  if (["Submitted", "Under Review", "Selected"].includes(application.status)) {
    application.status = "Active";
  }

  if (!application.startDate) {
    application.startDate = new Date();
    const durationDoc = await Duration.findById(application.duration);
    const end = new Date();
    end.setDate(end.getDate() + (durationDoc?.weeks || 4) * 7);
    application.endDate = end;
  }

  await application.save();

  let payment = await Payment.findOne({ application: application._id });
  if (!payment) {
    payment = new Payment({
      application: application._id,
      student: application.student._id,
      orderId: `admin_approved_${Date.now()}`,
      amount: application.duration?.fee || 100,
      currency: "INR",
    });
  }
  payment.status = "Successful";
  payment.paymentId = `ADMIN_VERIFIED_${Date.now()}`;
  await payment.save();

  const t = templates.paymentSuccess(application.student.fullName, application.duration?.fee || 100);
  await sendEmail({ to: application.student.email, ...t }).catch(() => {});

  res.json({ success: true, application, payment });
});

// Admin Direct Certificate Issuance (Instant Issue & Complete)
router.post("/applications/:id/issue-certificate", async (req, res) => {
  const application = await Application.findById(req.params.id).populate("domain").populate("duration").populate("student");
  if (!application) return res.status(404).json({ message: "Application record not found." });

  const durationWeeks = Number(application.duration?.weeks || 4);
  const requiredTasks = getRequiredTaskCount(durationWeeks);
  const submissionCount = await Submission.countDocuments({
    application: application._id,
    status: { $in: ["Submitted", "Under Review", "Approved", "Needs Revision"] },
  });

  if (!canIssueCertificate(application, submissionCount, requiredTasks)) {
    return res.status(400).json({
      message: "Certificate can only be issued after the payment is successful, the final report is submitted, and all required task submissions are complete.",
    });
  }

  // Update application state
  application.paymentStatus = "Successful";
  application.status = "Completed";
  application.certificateIssued = true;
  if (!application.startDate) application.startDate = new Date();
  if (!application.endDate) {
    const end = new Date();
    end.setDate(end.getDate() + (application.duration?.weeks || 4) * 7);
    application.endDate = end;
  }
  await application.save();

  // Create or retrieve Certificate document
  let cert = await Certificate.findOne({ application: application._id });
  if (!cert) {
    const certificateId = generateCertificateId(await getNextCertificateSequence(Certificate));
    const verificationId = generateVerificationId();
    const pdfUrl = await generateCertificatePdf({
      studentName: application.student.fullName,
      collegeName: application.student.college || "",
      domainName: application.domain?.name || "Tech Internship Domain",
      durationLabel: application.duration?.label || "4 Weeks Track",
      startDate: application.startDate,
      endDate: application.endDate,
      certificateId,
      verificationId,
      orgName: "InternDock",
    });
    cert = await Certificate.create({
      application: application._id,
      student: application.student._id,
      certificateId,
      verificationId,
      pdfUrl,
    });
  }

  const t = templates.certificateIssued(application.student.fullName);
  await sendEmail({ to: application.student.email, ...t }).catch(() => {});

  res.json({ success: true, message: "Certificate issued successfully!", application, certificate: cert });
});

// ---- Email logs ----
router.get("/email-logs", async (req, res) => {
  res.json(getEmailLog());
});

const net = require("net");

function probePort(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const s = net.createConnection({ host, port, timeout: timeoutMs }, () => {
      s.destroy();
      resolve({ port, status: "open" });
    });
    s.on("timeout", () => {
      s.destroy();
      resolve({ port, status: "timeout" });
    });
    s.on("error", (err) => {
      s.destroy();
      resolve({ port, status: "error", message: err.message });
    });
  });
}

// POST /api/admin/test-email - Send a test email to verify SMTP delivery
router.post("/test-email", async (req, res) => {
  const target = req.body.to || "support@interndock.in";
  try {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const [p587, p465] = await Promise.all([
      probePort(host, 587, 3000),
      probePort(host, 465, 3000),
    ]);

    const result = await sendEmail({
      to: target,
      subject: `[InternDock System Test] SMTP Verification (${new Date().toISOString()})`,
      html: `<div style="font-family: Arial, sans-serif; padding: 16px;"><h3>SMTP Test Successful</h3><p>Your email service is operating normally over IPv4.</p></div>`,
      replyTo: "support@interndock.in",
    });
    return res.json({ success: result.status === "Sent", result, portProbes: { 587: p587, 465: p465 } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
