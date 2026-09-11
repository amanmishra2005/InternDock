const express = require("express");
const router = express.Router();
const { sendEmail, templates } = require("../utils/sendEmail");
const { appendToSpreadsheet } = require("../utils/spreadsheetStorage");
const { supportTargetEmail } = require("../utils/emailTargets");

// POST /api/contact - Submit contact form query to support@interndock.in
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    const supportTarget = supportTargetEmail();

    const contactRecord = {
      name,
      email,
      subject: subject || "General Inquiry",
      message,
      recipientEmail: supportTarget,
    };

    appendToSpreadsheet("contact_queries", {
      contactId: `contact_${Date.now()}`,
      name,
      email,
      subject: subject || "General Inquiry",
      message,
      recipientEmail: supportTarget,
    });

    const notifyTemplate = templates.newContactQueryNotification(name, email, subject, message);
    const autoReplyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Thank you for contacting InternDock!</h2>
        <p style="color: #334155; font-size: 15px;">Hi ${name},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">We have received your message regarding "<strong>${subject || 'General Inquiry'}</strong>". Our support and admissions team will review your inquiry and get back to you shortly at ${supportTarget}.</p>
        <div style="background: #f8fafc; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #475569;">
          <strong>Support Desk Email:</strong> ${supportTarget}<br />
          <strong>Direct Support Line:</strong> +91 8808307121<br />
          <strong>Website:</strong> <a href="https://www.interndock.in" style="color: #0284c7;">www.interndock.in</a>
        </div>
        <p style="color: #334155; font-size: 14px;">Best regards,<br /><strong>InternDock Admissions &amp; Support Team</strong></p>
      </div>
    `;

    await Promise.allSettled([
      sendEmail({ to: supportTarget, ...notifyTemplate, replyTo: email }),
      sendEmail({ to: email, subject: "We received your message - InternDock Support", html: autoReplyHtml, replyTo: "support@interndock.in" })
    ]);

    return res.json({
      success: true,
      message: `Message received! Sent to ${supportTarget}`,
      contactId: contactRecord.contactId || `contact_${Date.now()}`,
    });
  } catch (err) {
    console.error("Contact API error:", err);
    return res.status(500).json({ message: "Error processing contact inquiry." });
  }
});

module.exports = router;
