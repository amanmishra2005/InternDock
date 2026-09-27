require("./networkFix");
const nodemailer = require("nodemailer");

const BLOCKED_RECIPIENTS = new Set();

const CANONICAL_EMAIL_ALIASES = {
  "support@interndock.in": "support.interndock@gmail.com",
  "admin@interndock.in": "support.interndock@gmail.com",
  "contact@interndock.in": "support.interndock@gmail.com",
  "help@interndock.in": "support.interndock@gmail.com",
};

// In-memory email log for admin auditing
const emailLog = [];

// Deduplication map to prevent duplicate triggers (30-second window)
const recentDispatches = new Map();
const DEDUPLICATION_WINDOW_MS = 30000;

function pruneRecentDispatches() {
  const now = Date.now();
  for (const [key, value] of recentDispatches.entries()) {
    if (now - value.timestamp > DEDUPLICATION_WINDOW_MS) {
      recentDispatches.delete(key);
    }
  }
}

function getDispatchKey(recipients, subject, html) {
  const normRecipients = recipients.slice().sort().join(",");
  const snippet = String(html || "").slice(0, 100);
  return `${normRecipients}::${subject}::${snippet}`;
}

function normalizeRecipientsForDispatch(to) {
  if (!to) return [];

  const parsed = String(to)
    .split(/[;,]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const recipientSet = new Set();
  parsed.forEach((entry) => {
    const canonical = CANONICAL_EMAIL_ALIASES[entry] || entry;
    if (!BLOCKED_RECIPIENTS.has(canonical)) {
      recipientSet.add(canonical);
    }
  });

  return Array.from(recipientSet);
}

function getPreferredFromAddress() {
  const configuredFrom = String(process.env.EMAIL_FROM || "").trim();
  const smtpUser = String(process.env.SMTP_USER || "").trim();

  if (!smtpUser) {
    return configuredFrom || "InternDock <support.interndock@gmail.com>";
  }

  const configuredDisplay = configuredFrom.includes("<")
    ? configuredFrom.slice(0, configuredFrom.indexOf("<")).trim().replace(/^"|"$/g, "") || "InternDock"
    : configuredFrom || "InternDock";

  const display = configuredDisplay || "InternDock";
  const safeSmtpUser = smtpUser.toLowerCase();
  if (safeSmtpUser === "support.interndock@gmail.com") {
    return `${display} <support.interndock@gmail.com>`;
  }

  return `${display} <${smtpUser}>`;
}

function getResendFromAddress() {
  if (process.env.RESEND_FROM) {
    return process.env.RESEND_FROM.trim();
  }
  const configuredFrom = String(process.env.EMAIL_FROM || "").trim();
  const isWebmail = /@(gmail|googlemail|yahoo|hotmail|outlook)\.com/i.test(configuredFrom);
  if (configuredFrom && !isWebmail) {
    return configuredFrom;
  }
  return "InternDock <onboarding@resend.dev>";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let cachedTransporter = null;

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const requireTLS = process.env.SMTP_REQUIRE_TLS !== "false";
  const connectionTimeout = Math.min(Math.max(Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000, 3000), 30000);
  const socketTimeout = Math.min(Math.max(Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000, 5000), 45000);

  return { host, port, user, pass, secure, requireTLS, connectionTimeout, socketTimeout };
}

function createTransporter(port, secure) {
  const config = getSmtpConfig();
  const effectivePort = port || config.port;
  const effectiveSecure = secure !== undefined ? secure : (process.env.SMTP_SECURE === "true" || effectivePort === 465);

  return nodemailer.createTransport({
    host: config.host,
    port: effectivePort,
    secure: effectiveSecure,
    requireTLS: !effectiveSecure && config.requireTLS,
    connectionTimeout: config.connectionTimeout,
    socketTimeout: config.socketTimeout,
    tls: { rejectUnauthorized: false },
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function getTransporter() {
  const config = getSmtpConfig();
  if (!config.user || !config.pass) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = createTransporter(config.port, config.secure);
  }

  return cachedTransporter;
}

function classifySmtpError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "").toUpperCase();
  const responseCode = err?.responseCode || 0;

  if (
    code === "EAUTH" ||
    responseCode === 535 ||
    msg.includes("badauth") ||
    msg.includes("invalid login") ||
    msg.includes("username and password not accepted")
  ) {
    return {
      type: "SMTP authentication failure",
      message: `Invalid username or App Password (check SMTP_USER and SMTP_PASS). Original: ${err.message}`,
    };
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENETUNREACH" ||
    code === "ESOCKET" ||
    msg.includes("timeout") ||
    msg.includes("econn") ||
    msg.includes("network")
  ) {
    return {
      type: "Connection failure",
      message: `Could not connect to SMTP server: ${err.message}`,
    };
  }

  if (
    code === "EENVELOPE" ||
    responseCode === 550 ||
    responseCode === 553 ||
    responseCode === 501 ||
    msg.includes("recipient") ||
    msg.includes("mailbox unavailable")
  ) {
    return {
      type: "Invalid recipient",
      message: `Recipient address rejected by server: ${err.message}`,
    };
  }

  if (responseCode >= 500 || msg.includes("rejected")) {
    return {
      type: "SMTP rejection",
      message: `SMTP server rejected message (${responseCode || "5xx"}): ${err.message}`,
    };
  }

  return {
    type: "General email error",
    message: err.message || "Unknown SMTP error",
  };
}

async function sendRecipientBatch(transporter, from, recipients, subject, html, replyTo) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return [];
  }

  const effectiveReplyTo = replyTo || process.env.REPLY_TO || "support.interndock@gmail.com";

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const mailOptions = {
        from,
        to: recipient,
        replyTo: effectiveReplyTo,
        subject,
        html,
      };
      return transporter.sendMail(mailOptions);
    })
  );

  return results;
}

async function sendViaResendFallback(recipients, subject, html, replyTo) {
  const rawKey = process.env.RESEND_API_KEY;
  if (!rawKey) return null;
  const resendApiKey = String(rawKey).replace(/^"|"$/g, "").trim();
  if (!resendApiKey) return null;

  const from = getResendFromAddress();
  const effectiveReplyTo = replyTo || process.env.REPLY_TO || "support.interndock@gmail.com";

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject,
          html,
          reply_to: effectiveReplyTo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`Resend API (${res.status}): ${data.message || JSON.stringify(data)}`);
      }
      return { recipient, messageId: data.id };
    })
  );

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  if (fulfilled.length > 0) {
    const messageId = fulfilled.map((f) => f.value?.messageId).filter(Boolean).join(", ");
    const sentTo = fulfilled.map((f) => f.value?.recipient);
    return { status: "fulfilled", value: { messageId, sentTo } };
  }

  const errDetail = rejected.map((r) => r.reason?.message).join("; ");
  throw new Error(`Resend fallback failed: ${errDetail}`);
}

/**
 * Centralized, reliable email dispatch function.
 * Uses primary SMTP configuration with automatic failover between ports 587 and 465,
 * duplicate suppression, rich error logging, and optional HTTP fallback if SMTP ports are blocked.
 */
async function sendEmail({ to, subject, html, replyTo }) {
  const recipients = normalizeRecipientsForDispatch(to);
  const safeTo = recipients.join(", ");

  const entry = {
    success: false,
    to: safeTo,
    subject,
    html,
    sentAt: new Date(),
    status: "Pending",
    error: null,
    messageId: null,
    sentTo: [],
  };

  emailLog.unshift(entry);
  if (emailLog.length > 200) emailLog.pop();

  if (!safeTo || recipients.length === 0) {
    entry.status = "Failed";
    entry.error = "No valid recipients specified";
    console.warn(`[EMAIL WARNING] Attempted to send email with no valid recipients: "${to}"`);
    return entry;
  }

  // Deduplication check: avoid firing identical emails within 30 seconds
  pruneRecentDispatches();
  const dispatchKey = getDispatchKey(recipients, subject, html);
  const existingDispatch = recentDispatches.get(dispatchKey);
  if (existingDispatch && (Date.now() - existingDispatch.timestamp < DEDUPLICATION_WINDOW_MS)) {
    console.log(`[EMAIL DEDUPLICATION] Suppressed duplicate email to "${safeTo}" with subject "${subject}" (sent ${Math.round((Date.now() - existingDispatch.timestamp) / 1000)}s ago).`);
    entry.success = true;
    entry.status = "Sent";
    entry.messageId = existingDispatch.messageId || "duplicate-suppressed";
    entry.sentTo = recipients;
    entry.duplicateSuppressed = true;
    return entry;
  }

  const config = getSmtpConfig();
  const smtpConfigured = Boolean(config.user && config.pass);

  if (!smtpConfigured) {
    entry.status = "Skipped";
    entry.error = "Missing environment variables: SMTP_USER or SMTP_PASS is not configured.";
    console.warn(`[EMAIL CONFIG WARNING] SMTP credentials missing in process.env (SMTP_USER or SMTP_PASS).`);

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n----- EMAIL SIMULATION (SMTP Not Configured) -----`);
      console.log(`To: ${safeTo}\nReply-To: ${replyTo || "default"}\nSubject: ${subject}\nBody: ${html.slice(0, 300)}...`);
      console.log(`--------------------------------------------------\n`);
      entry.success = true;
      entry.messageId = `sim_${Date.now()}`;
      entry.sentTo = recipients;
      recentDispatches.set(dispatchKey, { timestamp: Date.now(), messageId: entry.messageId });
      return entry;
    }

    // Try Resend fallback if available
    if (process.env.RESEND_API_KEY) {
      try {
        console.log(`[EMAIL NOTICE] Attempting Resend fallback since SMTP is not configured...`);
        const fallbackRes = await sendViaResendFallback(recipients, subject, html, replyTo);
        if (fallbackRes?.value) {
          entry.success = true;
          entry.status = "Sent";
          entry.messageId = fallbackRes.value.messageId;
          entry.sentTo = fallbackRes.value.sentTo;
          entry.error = null;
          console.log(`[RESEND SUCCESS] Delivered to ${entry.sentTo.join(", ")} | ID: ${entry.messageId}`);
          recentDispatches.set(dispatchKey, { timestamp: Date.now(), messageId: entry.messageId });
          return entry;
        }
      } catch (fallbackErr) {
        console.error(`[RESEND ERROR] Resend fallback failed:`, fallbackErr.message);
        entry.error += ` | Resend: ${fallbackErr.message}`;
      }
    }

    return entry;
  }

  // 1. Primary Dispatch: Direct Nodemailer SMTP
  try {
    const transporter = getTransporter();
    const from = getPreferredFromAddress();

    let results = await sendRecipientBatch(transporter, from, recipients, subject, html, replyTo);
    let successes = results.filter((r) => r.status === "fulfilled");
    let failures = results.filter((r) => r.status === "rejected");

    // Auto-failover: if primary port (e.g. 587) timed out, retry alternative port (465 SSL)
    if (successes.length === 0 && failures.length > 0) {
      const isNetworkFailure = failures.some((f) => {
        const msg = (f.reason?.message || "").toLowerCase();
        return msg.includes("timeout") || msg.includes("econn") || msg.includes("enetunreach") || msg.includes("esocket");
      });

      if (isNetworkFailure) {
        const currentPort = Number(process.env.SMTP_PORT) || 587;
        const altPort = currentPort === 465 ? 587 : 465;
        const altSecure = altPort === 465;
        console.warn(`[SMTP FAILOVER] Primary port ${currentPort} timed out. Retrying on port ${altPort} (secure: ${altSecure})...`);

        const altTransporter = createTransporter(altPort, altSecure);
        const altResults = await sendRecipientBatch(altTransporter, from, recipients, subject, html, replyTo);
        const altSuccesses = altResults.filter((r) => r.status === "fulfilled");

        if (altSuccesses.length > 0) {
          cachedTransporter = altTransporter;
          results = altResults;
          successes = altSuccesses;
          failures = altResults.filter((r) => r.status === "rejected");
        }
      }
    }

    if (successes.length > 0) {
      const delivered = recipients.filter((_, idx) => results[idx]?.status === "fulfilled");
      const messageIds = successes.map((s) => s.value?.messageId).filter(Boolean);
      entry.success = true;
      entry.status = "Sent";
      entry.messageId = messageIds.join(", ");
      entry.sentTo = delivered;
      entry.error = null;
      console.log(`[SMTP SUCCESS] Delivered to ${delivered.join(", ")} | Subject: "${subject}" | MessageID: ${entry.messageId}`);
      recentDispatches.set(dispatchKey, { timestamp: Date.now(), messageId: entry.messageId });
      return entry;
    }

    // SMTP rejected/failed for all recipients
    const firstReason = failures[0]?.reason;
    const classified = classifySmtpError(firstReason);
    console.error(`[SMTP ERROR - ${classified.type}] ${classified.message}`);
    entry.error = classified.message;

    // 2. Secondary fallback: Resend HTTP API (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        console.log(`[SMTP FALLBACK] Attempting Resend API fallback for ${safeTo}...`);
        const fallbackRes = await sendViaResendFallback(recipients, subject, html, replyTo);
        if (fallbackRes?.value) {
          entry.success = true;
          entry.status = "Sent";
          entry.messageId = fallbackRes.value.messageId;
          entry.sentTo = fallbackRes.value.sentTo;
          entry.error = null;
          console.log(`[RESEND SUCCESS] Fallback delivered to ${entry.sentTo.join(", ")} | ID: ${entry.messageId}`);
          recentDispatches.set(dispatchKey, { timestamp: Date.now(), messageId: entry.messageId });
          return entry;
        }
      } catch (fallbackErr) {
        console.error(`[RESEND FALLBACK FAILED]`, fallbackErr.message);
        entry.error += ` | Resend fallback: ${fallbackErr.message}`;
      }
    }

    entry.status = "Failed";
    return entry;
  } catch (err) {
    const classified = classifySmtpError(err);
    console.error(`[EMAIL EXCEPTION - ${classified.type}] ${classified.message}`);
    entry.status = "Failed";
    entry.error = classified.message;
    return entry;
  }
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
    subject: `Application Confirmed: ${escapeHtml(domainName)} Internship Track (${escapeHtml(applicationId)})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">🎉 Application Received Successfully!</h2>
        <p style="color: #334155; font-size: 15px;">Dear ${escapeHtml(name)},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Thank you for applying for the <strong>${escapeHtml(domainName)}</strong> internship program on <strong>InternDock</strong>. Your application has been registered with our academic admissions cohort.</p>
        
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #0284c7; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
          <p style="margin: 4px 0;"><strong>Internship Track:</strong> ${escapeHtml(domainName)}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Registered &amp; Ready for Workspace Access</p>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 8px;">Next Steps:</h3>
        <ol style="color: #475569; font-size: 14px; line-height: 1.6; padding-left: 20px; margin-top: 0;">
          <li>Log in to your <strong><a href="https://www.interndock.in/dashboard" style="color: #0284c7; text-decoration: none;">InternDock Student Dashboard</a></strong>.</li>
          <li>Access your <strong>Application Workspace</strong> to review your official selection offer letter and curriculum roadmap.</li>
          <li>Complete your program verification to unlock project repositories, guided milestones, and mentor evaluations.</li>
        </ol>

        <p style="color: #334155; font-size: 14px; margin-top: 24px;">If you have any questions or require guidance, feel free to reply to this email or contact us anytime at <a href="mailto:support.interndock@gmail.com" style="color: #0284c7; font-weight: bold;">InternDock</a>.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Best regards,<br />
          <strong>InternDock Admissions &amp; Academic Cohort Team</strong><br />
          <a href="https://www.interndock.in" style="color: #0284c7; text-decoration: none;">www.interndock.in</a>
        </p>
      </div>
    `,
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
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support.interndock@gmail.com | InternDock Admissions & Support System</p>
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
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Recipient: support.interndock@gmail.com | Sent via www.interndock.in contact portal</p>
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
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support.interndock@gmail.com | InternDock Finance & Accounts</p>
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
  paymentSuccess: (name, amount, applicationId) => ({
    subject: `Payment Confirmed - InternDock Internship Verification (₹${escapeHtml(amount)})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">💳 Payment Successfully Confirmed!</h2>
        <p style="color: #334155; font-size: 15px;">Dear ${escapeHtml(name)},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">We have received and verified your payment of <strong>₹${escapeHtml(amount)}</strong> for your InternDock internship program.</p>
        
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${escapeHtml(amount)}</p>
          ${applicationId ? `<p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>` : ""}
          <p style="margin: 4px 0;"><strong>Workspace Status:</strong> Active &amp; Fully Unlocked</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your workspace is now active. You have full access to guided milestones, project guides, and capstone project submissions.</p>
        <p style="margin-top: 16px;"><a href="https://www.interndock.in/dashboard" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Open My Internship Workspace</a></p>
        <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Best regards,<br />
          <strong>InternDock Finance &amp; Accounts Team</strong><br />
          <a href="https://www.interndock.in" style="color: #0284c7; text-decoration: none;">www.interndock.in</a>
        </p>
      </div>
    `,
  }),
  finalReportSubmitted: (studentName, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => {
    let studentEmail = "";
    let applicationId = "";
    let domainName = "";
    let projectTitle = "";
    let githubUrl = "";
    let hostedUrl = "";
    let summary = "";

    if (arg4 !== undefined) {
      studentEmail = arg2 || "";
      applicationId = arg3 || "";
      domainName = arg4 || "";
      projectTitle = arg5 || "";
      githubUrl = arg6 || "";
      hostedUrl = arg7 || "";
      summary = arg8 || "";
    } else {
      applicationId = arg2 || "";
      domainName = arg3 || "";
    }

    return {
      subject: `[Final Capstone Submission] ${escapeHtml(studentName)} - ${escapeHtml(applicationId)} (${escapeHtml(domainName || "Internship Track")})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">📋 Capstone Final Report Submitted</h2>
          <p style="color: #334155; font-size: 15px;">A student candidate has completed and submitted their final internship capstone report for evaluation.</p>
          <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #10b981; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155;">
            <p style="margin: 4px 0;"><strong>Student Name:</strong> ${escapeHtml(studentName)}</p>
            ${studentEmail ? `<p style="margin: 4px 0;"><strong>Student Email:</strong> ${escapeHtml(studentEmail)}</p>` : ""}
            <p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
            <p style="margin: 4px 0;"><strong>Domain Track:</strong> ${escapeHtml(domainName)}</p>
            ${projectTitle ? `<p style="margin: 4px 0;"><strong>Project Title:</strong> ${escapeHtml(projectTitle)}</p>` : ""}
            ${githubUrl ? `<p style="margin: 4px 0;"><strong>GitHub Repository:</strong> <a href="${escapeHtml(githubUrl)}" target="_blank" style="color: #4f46e5; word-break: break-all;">${escapeHtml(githubUrl)}</a></p>` : ""}
            ${hostedUrl ? `<p style="margin: 4px 0;"><strong>Live Demo:</strong> <a href="${escapeHtml(hostedUrl)}" target="_blank" style="color: #0284c7; word-break: break-all;">${escapeHtml(hostedUrl)}</a></p>` : ""}
            ${summary ? `<p style="margin: 8px 0 4px 0;"><strong>Executive Summary:</strong></p><p style="margin: 0; color: #475569; font-size: 13px; white-space: pre-wrap;">${escapeHtml(summary)}</p>` : ""}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support.interndock@gmail.com | InternDock Evaluation Team</p>
        </div>
      `,
    };
  },
  finalReportStudentConfirmation: (name, applicationId, domainName, projectTitle) => ({
    subject: `Final Capstone Project Submitted: ${escapeHtml(domainName || "Internship Track")} (${escapeHtml(applicationId)})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">🎓 Final Capstone Project Submitted!</h2>
        <p style="color: #334155; font-size: 15px;">Dear ${escapeHtml(name)},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Congratulations on completing and submitting your final capstone project${projectTitle ? ` for "<strong>${escapeHtml(projectTitle)}</strong>"` : ""} in the <strong>${escapeHtml(domainName || "Internship Track")}</strong> program on <strong>InternDock</strong>.</p>
        
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
          <p style="margin: 4px 0;"><strong>Domain Track:</strong> ${escapeHtml(domainName || "Internship Track")}</p>
          ${projectTitle ? `<p style="margin: 4px 0;"><strong>Project Title:</strong> ${escapeHtml(projectTitle)}</p>` : ""}
          <p style="margin: 4px 0;"><strong>Review Status:</strong> Under Mentor Evaluation</p>
        </div>

        <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 8px;">What Happens Next?</h3>
        <ul style="color: #475569; font-size: 14px; line-height: 1.6; padding-left: 20px; margin-top: 0;">
          <li>Our mentor evaluation board will review your repository, live demo, and final project write-up.</li>
          <li>Upon approval, your cryptographically verifiable <strong>Certificate of Internship Completion &amp; Merit</strong> will be issued directly on your dashboard.</li>
          <li>Your credential will also be permanently verifiable online at <a href="https://www.interndock.in/verify" style="color: #0284c7; text-decoration: none;">interndock.in/verify</a> for recruiter background checks.</li>
        </ul>

        <p style="color: #334155; font-size: 14px; margin-top: 24px;">Need assistance? Contact our mentor support team at <a href="mailto:support.interndock@gmail.com" style="color: #0284c7; font-weight: bold;">InternDock</a>.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Best regards,<br />
          <strong>InternDock Evaluation &amp; Mentorship Board</strong><br />
          <a href="https://www.interndock.in" style="color: #0284c7; text-decoration: none;">www.interndock.in</a>
        </p>
      </div>
    `,
  }),
  assignmentSubmitted: (studentName, studentEmail, applicationId, assignmentTitle, githubUrl) => ({
    subject: `[Milestone Submission] ${escapeHtml(studentName)} submitted ${escapeHtml(assignmentTitle)} (${escapeHtml(applicationId)})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">📌 Milestone Task Submission</h2>
        <p style="color: #334155; font-size: 15px;">A student candidate has submitted milestone task deliverables.</p>
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #0284c7; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Student Name:</strong> ${escapeHtml(studentName)}</p>
          <p style="margin: 4px 0;"><strong>Student Email:</strong> ${escapeHtml(studentEmail)}</p>
          <p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
          <p style="margin: 4px 0;"><strong>Task Title:</strong> ${escapeHtml(assignmentTitle)}</p>
          ${githubUrl ? `<p style="margin: 4px 0;"><strong>GitHub URL:</strong> <a href="${escapeHtml(githubUrl)}" target="_blank" style="color: #4f46e5; word-break: break-all;">${escapeHtml(githubUrl)}</a></p>` : ""}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support.interndock@gmail.com | InternDock Evaluation Team</p>
      </div>
    `,
  }),
  certificateIssued: (name, applicationId, domainName, certificateId, verificationId) => {
    const certId = certificateId || "Verified";
    const domain = domainName || "Internship Track";
    const appId = applicationId || "";
    const verId = verificationId || "";

    return {
      subject: `🎓 Certificate Issued: ${escapeHtml(domain)} - InternDock (${escapeHtml(certId)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">🎉 Congratulations! Your Internship Certificate is Ready</h2>
          <p style="color: #334155; font-size: 15px;">Dear ${escapeHtml(name)},</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">We are pleased to inform you that you have successfully completed your internship track in <strong>${escapeHtml(domain)}</strong>. Your official Certificate of Completion &amp; Merit has been generated and issued.</p>
          
          <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #334155;">
            <p style="margin: 4px 0;"><strong>Certificate ID:</strong> ${escapeHtml(certId)}</p>
            ${verId ? `<p style="margin: 4px 0;"><strong>Verification ID:</strong> ${escapeHtml(verId)}</p>` : ""}
            ${appId ? `<p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(appId)}</p>` : ""}
            <p style="margin: 4px 0;"><strong>Domain Track:</strong> ${escapeHtml(domain)}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Issued &amp; Verified</p>
          </div>

          <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 8px;">Access Your Certificate:</h3>
          <ul style="color: #475569; font-size: 14px; line-height: 1.6; padding-left: 20px; margin-top: 0;">
            <li>Download your high-resolution verified PDF from your <a href="https://www.interndock.in/dashboard" style="color: #0284c7; font-weight: bold; text-decoration: none;">Student Dashboard</a>.</li>
            <li>Your credential is permanently verifiable by recruiters and employers online at <a href="https://www.interndock.in/verify" style="color: #0284c7; text-decoration: none;">interndock.in/verify</a>.</li>
          </ul>

          <p style="margin-top: 20px;">
            <a href="https://www.interndock.in/dashboard" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">View &amp; Download Certificate</a>
          </p>

          <p style="color: #334155; font-size: 14px; margin-top: 24px;">Thank you for your outstanding performance and dedication throughout the internship. We wish you immense success in your tech career!</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Best regards,<br />
            <strong>InternDock Certification &amp; Academic Board</strong><br />
            <a href="https://www.interndock.in" style="color: #0284c7; text-decoration: none;">www.interndock.in</a>
          </p>
        </div>
      `,
    };
  },
  newCertificateAdminNotification: (studentName, studentEmail, applicationId, domainName, certificateId, verificationId) => ({
    subject: `[Certificate Issued] ${escapeHtml(studentName)} - ${escapeHtml(certificateId || applicationId)} (${escapeHtml(domainName || "Track")})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">🎓 Certificate Issued to Candidate</h2>
        <p style="color: #334155; font-size: 15px;">An official Certificate of Completion &amp; Merit has been issued for the following candidate:</p>
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Student Name:</strong> ${escapeHtml(studentName)}</p>
          ${studentEmail ? `<p style="margin: 4px 0;"><strong>Student Email:</strong> ${escapeHtml(studentEmail)}</p>` : ""}
          <p style="margin: 4px 0;"><strong>Certificate ID:</strong> ${escapeHtml(certificateId || "N/A")}</p>
          ${verificationId ? `<p style="margin: 4px 0;"><strong>Verification ID:</strong> ${escapeHtml(verificationId)}</p>` : ""}
          ${applicationId ? `<p style="margin: 4px 0;"><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>` : ""}
          <p style="margin: 4px 0;"><strong>Domain Track:</strong> ${escapeHtml(domainName || "Standard Track")}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Dispatched to support.interndock@gmail.com | InternDock Certification System</p>
      </div>
    `,
  }),
  emailVerification: (name, code, expiryMinutes = 15) => ({
    subject: `Your InternDock Verification Code: ${escapeHtml(code)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-bottom: 4px;">Verify Your Email Address</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">InternDock Internship Platform</p>
        </div>
        <p style="color: #334155; font-size: 15px;">Hi ${escapeHtml(name)},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Thank you for registering on <strong>InternDock</strong>. To complete your candidate registration and activate your account, please enter this one-time verification code:</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #0284c7; padding: 14px 32px; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #0284c7; font-family: 'Courier New', monospace;">
            ${escapeHtml(code)}
          </div>
          <p style="color: #64748b; font-size: 13px; margin-top: 8px;">Valid for <strong>${expiryMinutes} minutes</strong>. Do not share this code with anyone.</p>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Once verified, you will have immediate access to your candidate dashboard, domain curricula, and verifiable internship workspaces.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 14px;">If you did not attempt to register on InternDock, please disregard this email.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 14px;">
          Best regards,<br />
          <strong>InternDock Admissions &amp; Security Team</strong><br />
          <a href="https://www.interndock.in" style="color: #0284c7; text-decoration: none;">www.interndock.in</a>
        </p>
      </div>
    `,
  }),
};

module.exports = {
  sendEmail,
  getEmailLog,
  templates,
  normalizeRecipientsForDispatch,
  getPreferredFromAddress,
  getResendFromAddress,
  createTransporter,
  classifySmtpError,
};
