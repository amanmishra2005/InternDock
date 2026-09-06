const nodemailer = require("nodemailer");

let transporter = null;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
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
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "no-reply@example.com",
        to,
        subject,
        html,
      });
    } else {
      entry.status = "Skipped";
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n----- EMAIL (not sent, no SMTP configured) -----`);
        console.log(`To: ${to}\nSubject: ${subject}\n${html}`);
        console.log(`--------------------------------------------------\n`);
      }
      return entry;
    }
    entry.status = "Sent";
  } catch (err) {
    entry.status = "Failed";
    entry.error = err.message;
    console.error("Email send failed:", err.message);
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
    html: `<p>Hi ${name},</p><p>Thanks for creating an account. Explore our internship domains and apply when you're ready.</p>`,
  }),
  applicationSubmitted: (name, applicationId, domainName) => ({
    subject: "Application received",
    html: `<p>Hi ${name},</p><p>We've received your application (<b>${applicationId}</b>) for the <b>${domainName}</b> internship. We'll notify you once it has been reviewed.</p>`,
  }),
  selected: (name, domainName) => ({
    subject: "Congratulations! You have been selected",
    html: `<p>Hi ${name},</p><p>You have been selected for the <b>${domainName}</b> internship program. Your offer letter is now available on your dashboard.</p>`,
  }),
  rejected: (name, domainName) => ({
    subject: "Update on your application",
    html: `<p>Hi ${name},</p><p>Thank you for applying to the <b>${domainName}</b> internship. Unfortunately we are unable to offer you a place at this time.</p>`,
  }),
  paymentSuccess: (name, amount) => ({
    subject: "Payment successful",
    html: `<p>Hi ${name},</p><p>We've received your payment of ₹${amount}. You now have full access to your internship workspace.</p>`,
  }),
  certificateIssued: (name) => ({
    subject: "Your internship certificate is ready",
    html: `<p>Hi ${name},</p><p>Congratulations on completing your internship! Your certificate is ready to download from your dashboard.</p>`,
  }),
};

module.exports = { sendEmail, getEmailLog, templates };
