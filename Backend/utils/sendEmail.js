const nodemailer = require("nodemailer");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTransporter() {
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
  if (!smtpConfigured) return null;

  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Simple in-memory email log, exposed for the admin "email logs" view.
const emailLog = [];

async function sendEmail({ to, subject, html }) {
  const entry = { to, subject, html, sentAt: new Date(), status: "Pending" };
  emailLog.unshift(entry);

  try {
    const transporter = getTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || "InternDock <support@interndock.in>",
        to,
        subject,
        html,
      });
      entry.status = "Sent";
      entry.messageId = info.messageId;
    } else {
      entry.status = "Skipped";
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n----- EMAIL (not sent, no SMTP configured) -----`);
        console.log(`To: ${to}\nSubject: ${subject}\n${html}`);
        console.log(`--------------------------------------------------\n`);
      }
      return entry;
    }
  } catch (err) {
    entry.status = "Failed";
    entry.error = err.message;
    console.error(`Email send failed to ${to}:`, err.message);
  }

  return entry;
}

function getEmailLog() {
  return emailLog.slice(0, 200);
}

// ---- Reusable templates ----
const templates = {
  welcome: (name) => ({
    subject: "Welcome to InternDock",
    html: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for creating an account. Explore our internship domains and apply when you're ready.</p>`,
  }),
  applicationSubmitted: (name, applicationId, domainName) => ({
    subject: "Application received - InternDock",
    html: `<p>Hi ${escapeHtml(name)},</p><p>We've received your application (<b>${escapeHtml(applicationId)}</b>) for the <b>${escapeHtml(domainName)}</b> internship. We'll notify you once it has been reviewed.</p>`,
  }),
  newApplicationAdminNotification: (studentName, studentEmail, domainName, durationWeeks, applicationId, startDate, endDate) => ({
    subject: `[New Student Application] ${escapeHtml(studentName)} applied for ${escapeHtml(domainName)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">🎓 New Internship Application Submitted</h2>
        <p style="color: #334155; font-size: 15px;">A new candidate has registered for an internship program on <strong>InternDock</strong>.</p>
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #0284c7; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Student Name:</strong> ${escapeHtml(studentName)}</p>
          <p style="margin: 4px 0;"><strong>Student Email:</strong> ${escapeHtml(studentEmail)}</p>
          <p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
          <p style="margin: 4px 0;"><strong>Domain:</strong> ${escapeHtml(domainName)}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${escapeHtml(durationWeeks)} Weeks</p>
          <p style="margin: 4px 0;"><strong>Start Date:</strong> ${escapeHtml(startDate || "Immediate")}</p>
          <p style="margin: 4px 0;"><strong>End Date:</strong> ${escapeHtml(endDate || "Standard")}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support@interndock.in | InternDock Admissions & Support System</p>
      </div>
    `,
  }),
  newContactQueryNotification: (name, email, subject, message) => ({
    subject: `[New Website Inquiry] ${escapeHtml(subject || "Inquiry from " + name)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">📩 New Contact Form Message Received</h2>
        <p style="color: #475569; font-size: 14px;"><strong>From:</strong> ${escapeHtml(name)} (&lt;${escapeHtml(email)}&gt;)</p>
        <p style="color: #475569; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(subject || 'General Inquiry')}</p>
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #4f46e5; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; color: #334155; white-space: pre-wrap; font-size: 15px;">${escapeHtml(message)}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Recipient: support@interndock.in | Sent via www.interndock.in contact portal</p>
      </div>
    `,
  }),
  newPaymentAdminNotification: (studentName, studentEmail, amount, utrNumber, applicationId) => ({
    subject: `[Payment Confirmation] ₹${escapeHtml(amount)} registered by ${escapeHtml(studentName)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">💳 Internship Fee Payment Registered</h2>
        <p style="color: #334155; font-size: 15px;">A payment confirmation was submitted for application <strong>${escapeHtml(applicationId)}</strong>.</p>
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Student Name:</strong> ${escapeHtml(studentName)}</p>
          <p style="margin: 4px 0;"><strong>Student Email:</strong> ${escapeHtml(studentEmail)}</p>
          <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${escapeHtml(amount)}</p>
          <p style="margin: 4px 0;"><strong>UTR / Reference No:</strong> ${escapeHtml(utrNumber || "N/A")}</p>
          <p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support@interndock.in | InternDock Finance & Accounts</p>
      </div>
    `,
  }),
  selected: (name, domainName) => ({
    subject: "Congratulations! You have been selected",
    html: `<p>Hi ${escapeHtml(name)},</p><p>You have been selected for the <b>${escapeHtml(domainName)}</b> internship program. Your offer letter is now available on your dashboard.</p>`,
  }),
  rejected: (name, domainName) => ({
    subject: "Update on your application",
    html: `<p>Hi ${escapeHtml(name)},</p><p>Thank you for applying to the <b>${escapeHtml(domainName)}</b> internship. Unfortunately we are unable to offer you a place at this time.</p>`,
  }),
  paymentSuccess: (name, amount) => ({
    subject: "Payment successful",
    html: `<p>Hi ${escapeHtml(name)},</p><p>We've received your payment of ₹${escapeHtml(amount)}. You now have full access to your internship workspace.</p>`,
  }),
  certificateIssued: (name) => ({
    subject: "Your internship certificate is ready",
    html: `<p>Hi ${escapeHtml(name)},</p><p>Congratulations on completing your internship! Your certificate is ready to download from your dashboard.</p>`,
  }),
};


module.exports = { sendEmail, getEmailLog, templates };
