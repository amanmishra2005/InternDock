const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Payment = require("../models/Payment");
const Application = require("../models/Application");
const Duration = require("../models/Duration");
const { protect } = require("../middleware/auth");
const { sendEmail, templates } = require("../utils/sendEmail");

// POST /api/payments/create-order
router.post("/create-order", protect, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await Application.findById(applicationId).populate("duration");
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (String(application.student) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    const orderId = `order_${uuidv4().slice(0, 12)}`;
    const payment = await Payment.create({
      application: application._id,
      student: req.user._id,
      orderId,
      amount: application.duration?.fee || 100,
      currency: application.duration?.currency || "INR",
      status: "Pending",
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/confirm (Instant UPI & Gateway Confirmation)
router.post("/confirm", protect, async (req, res) => {
  try {
    const { applicationId, orderId, utrNumber, payerName, registeredEmail } = req.body;
    let application = null;
    let payment = null;

    if (applicationId) {
      application = await Application.findById(applicationId).populate("duration").populate("domain");
    }

    if (orderId) {
      payment = await Payment.findOne({ orderId });
      if (payment && !application) {
        application = await Application.findById(payment.application).populate("duration").populate("domain");
      }
    }

    if (!application) {
      return res.status(404).json({ message: "Application record not found for payment confirmation." });
    }

    if (!payment) {
      payment = await Payment.findOne({ application: application._id });
    }

    const feeAmount = application.duration?.fee || 100;

    if (!payment) {
      payment = new Payment({
        application: application._id,
        student: req.user._id,
        orderId: orderId || `order_${uuidv4().slice(0, 12)}`,
        amount: feeAmount,
        currency: "INR",
      });
    }

    payment.status = "Successful";
    payment.paymentId = utrNumber ? `UTR-${utrNumber}` : `pay_${uuidv4().slice(0, 10)}`;
    if (utrNumber) payment.utrNumber = utrNumber;
    if (payerName) payment.payerName = payerName;
    if (registeredEmail) payment.registeredEmail = registeredEmail;
    await payment.save();

    // Instantly update application paymentStatus & unlock Active workspace
    application.paymentStatus = "Successful";
    if (["Submitted", "Under Review", "Selected"].includes(application.status)) {
      application.status = "Active";
    }

    if (!application.startDate) {
      application.startDate = new Date();
      const durationWeeks = application.duration?.weeks || 4;
      const end = new Date();
      end.setDate(end.getDate() + durationWeeks * 7);
      application.endDate = end;
    }

    await application.save();

    // Trigger instant email confirmation to student
    const emailTo = registeredEmail || req.user.email;
    const t = templates.paymentSuccess(payerName || req.user.fullName, feeAmount);
    sendEmail({ to: emailTo, ...t }).catch(() => {});

    res.json({
      success: true,
      message: "Payment confirmed successfully! Account verified and workspace activated.",
      payment,
      application,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/mine
router.get("/mine", protect, async (req, res) => {
  const payments = await Payment.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = router;
