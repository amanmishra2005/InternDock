const express = require("express");
const router = express.Router();
const ContactQuery = require("../models/ContactQuery");
const { sendEmail, templates } = require("../utils/sendEmail");

// POST /api/contact - Submit contact form query to support@interndock.in
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    const supportTargetEmail = process.env.SUPPORT_EMAIL || "support@interndock.in";

    // 1. Save query to database
    const contactRecord = await ContactQuery.create({
      name,
      email,
      subject: subject || "General Inquiry",
      message,
      recipientEmail: supportTargetEmail,
    });

    // 2. Send notification email to support@interndock.in
    const notifyTemplate = templates.newContactQueryNotification(name, email, subject, message);
    await sendEmail({
      to: supportTargetEmail,
      ...notifyTemplate,
    });


    // 3. Send auto-reply confirmation to the sender
    await sendEmail({
      to: email,
      subject: "We received your message - InternDock Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">Thank you for contacting InternDock!</h2>
          <p style="color: #334155; font-size: 15px;">Hi ${name},</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">We have received your message regarding "<strong>${subject || 'General Inquiry'}</strong>". Our support and admissions team will review your inquiry and get back to you shortly at support@interndock.in.</p>
          <div style="background: #f8fafc; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #475569;">
            <strong>Support Desk Email:</strong> support@interndock.in<br />
            <strong>Direct Support Line:</strong> +91 8808307121<br />
            <strong>Website:</strong> <a href="https://www.interndock.in" style="color: #0284c7;">www.interndock.in</a>
          </div>
          <p style="color: #334155; font-size: 14px;">Best regards,<br /><strong>InternDock Admissions &amp; Support Team</strong></p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "Message received! Sent to support@interndock.in",
      contactId: contactRecord._id,
    });
  } catch (err) {
    console.error("Contact API error:", err);
    return res.status(500).json({ message: "Error processing contact inquiry." });
  }
});

module.exports = router;
