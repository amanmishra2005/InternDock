require("./networkFix");
const nodemailer = require("nodemailer");

const BLOCKED_RECIPIENTS = new Set();

const CANONICAL_EMAIL_ALIASES = {};

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

async function sendRecipientBatch(transporter, from, recipients, subject, html, replyTo) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return [];
  }

  const effectiveReplyTo = replyTo || process.env.REPLY_TO || "support.interndock@gmail.com";

  // Dispatch to each recipient individually to guarantee independent delivery
  // to both primary support (support.interndock@gmail.com) and backup/student inboxes.
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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let cachedTransporter = null;

function createTransporter(port, secure) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 4000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 6000,
    tls: { rejectUnauthorized: false },
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function getTransporter() {
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
  if (!smtpConfigured) {
    console.warn("[SMTP WARNING] SMTP configuration missing in process.env (SMTP_HOST, SMTP_USER, or SMTP_PASS).");
    return null;
  }

  if (!cachedTransporter) {
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const isSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
    cachedTransporter = createTransporter(smtpPort, isSecure);
  }

  return cachedTransporter;
}

// Simple in-memory email log, exposed for the admin "email logs" view.
const emailLog = [];

function getResendFromAddress() {
  if (process.env.RESEND_FROM) {
    return process.env.RESEND_FROM.trim();
  }
  const configuredFrom = String(process.env.EMAIL_FROM || "").trim();
  // Resend API strictly forbids sending from unverified third-party consumer webmail domains like @gmail.com
  const isWebmail = /@(gmail|googlemail|yahoo|hotmail|outlook)\.com/i.test(configuredFrom);
  if (configuredFrom && !isWebmail) {
    return configuredFrom;
  }
  return "InternDock <onboarding@resend.dev>";
}

async function sendViaResend(recipients, subject, html, replyTo) {
  const rawKey = process.env.RESEND_API_KEY;
  if (!rawKey) return null;
  const resendApiKey = String(rawKey).replace(/^"|"$/g, "").trim();
  if (!resendApiKey) return null;

  const from = getResendFromAddress();
  const effectiveReplyTo = replyTo || process.env.REPLY_TO || "support.interndock@gmail.com";

  // Dispatch individually so sandbox recipient limits don't block delivery to verified inboxes
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
        throw new Error(`Resend error (${res.status}) for ${recipient}: ${data.message || JSON.stringify(data)}`);
      }
      return { recipient, messageId: data.id };
    })
  );

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  if (fulfilled.length > 0) {
    const messageId = fulfilled.map((f) => f.value?.messageId).filter(Boolean).join(", ");
    const sentTo = fulfilled.map((f) => f.value?.recipient);
    if (rejected.length > 0) {
      console.warn(`[RESEND PARTIAL] Delivered to ${sentTo.join(", ")}, failed for: ${rejected.map((r) => r.reason?.message).join("; ")}`);
    }
    return { status: "fulfilled", value: { messageId, sentTo } };
  }

  throw new Error(`Resend failed for all recipients: ${rejected.map((r) => r.reason?.message).join(" | ")}`);
}

async function sendViaBrevo(recipients, subject, html, replyTo) {
  const rawKey = process.env.BREVO_API_KEY;
  if (!rawKey) return null;
  const brevoApiKey = String(rawKey).replace(/^"|"$/g, "").trim();
  if (!brevoApiKey) return null;

  const effectiveReplyTo = replyTo || process.env.REPLY_TO || "support.interndock@gmail.com";
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "support.interndock@gmail.com";
  const senderName = process.env.ORG_NAME || "InternDock";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: recipients.map((r) => ({ email: r })),
      subject,
      htmlContent: html,
      replyTo: { email: effectiveReplyTo },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Brevo API error (${res.status}): ${data.message || JSON.stringify(data)}`);
  }
  return { status: "fulfilled", value: { messageId: data.messageId, sentTo: recipients } };
}

async function sendViaGoogleAppsScript(recipients, subject, html, replyTo) {
  const webhookUrl = (process.env.GOOGLE_SHEET_WEBHOOK_URL || "").trim();
  const webhookToken = (process.env.GOOGLE_SHEET_WEBHOOK_TOKEN || "").trim();
  if (!webhookUrl || !webhookToken) return null;

  const effectiveReplyTo = replyTo || process.env.REPLY_TO || "support.interndock@gmail.com";
  const senderName = process.env.ORG_NAME || "InternDock";

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookToken,
          action: "send_email",
          to: recipient,
          subject,
          html,
          replyTo: effectiveReplyTo,
          senderName,
        }),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok || text.includes("Error:") || text.includes("Unauthorized") || !text.includes("Email sent")) {
        throw new Error(`Apps Script did not send email for ${recipient} (response was: "${text.slice(0, 80)}"). Make sure Code.gs is updated and deployed as 'New version' in Google Apps Script.`);
      }
      return { recipient, text };
    })
  );

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  if (fulfilled.length > 0) {
    const sentTo = fulfilled.map((f) => f.value?.recipient);
    return { status: "fulfilled", value: { messageId: `gas_${Date.now()}`, sentTo } };
  }
  return null;
}

async function sendViaHttpApi(recipients, subject, html, replyTo) {
  // 1. Resend (Fast HTTPS transactional delivery)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend(recipients, subject, html, replyTo);
      if (res) return res;
    } catch (err) {
      console.warn("[HTTP RESEND NOTICE]", err.message);
    }
  }

  // 2. Brevo (Sendinblue API)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await sendViaBrevo(recipients, subject, html, replyTo);
      if (res) return res;
    } catch (err) {
      console.warn("[HTTP BREVO NOTICE]", err.message);
    }
  }

  // 3. Google Apps Script Webhook Relay
  if (process.env.GOOGLE_SHEET_WEBHOOK_URL && process.env.GOOGLE_SHEET_WEBHOOK_TOKEN) {
    try {
      const res = await sendViaGoogleAppsScript(recipients, subject, html, replyTo);
      if (res) return res;
    } catch (err) {
      console.warn("[HTTP GOOGLE APPS SCRIPT NOTICE]", err.message);
    }
  }

  return null;
}

async function sendEmail({ to, subject, html, replyTo }) {
  const recipients = normalizeRecipientsForDispatch(to);
  const safeTo = recipients.join(", ");

  const entry = { to: safeTo, subject, html, sentAt: new Date(), status: "Pending" };
  emailLog.unshift(entry);

  if (!safeTo) {
    entry.status = "Blocked";
    entry.error = "Blocked personal mailbox recipient";
    return entry;
  }

  try {
    // 1. Try HTTPS API delivery first (bypasses cloud host and ISP SMTP port blocks)
    const hasHttpEmailProvider = Boolean(
      process.env.RESEND_API_KEY ||
      process.env.BREVO_API_KEY ||
      (process.env.GOOGLE_SHEET_WEBHOOK_URL && process.env.GOOGLE_SHEET_WEBHOOK_TOKEN)
    );

    let remainingRecipients = [...recipients];
    const deliveredRecipients = [];
    const collectedMessageIds = [];

    if (hasHttpEmailProvider) {
      try {
        const httpResult = await sendViaHttpApi(remainingRecipients, subject, html, replyTo);
        if (httpResult && httpResult.value) {
          const sentTo = Array.isArray(httpResult.value.sentTo)
            ? httpResult.value.sentTo
            : remainingRecipients;
          deliveredRecipients.push(...sentTo);
          if (httpResult.value.messageId) {
            collectedMessageIds.push(httpResult.value.messageId);
          }

          const sentLower = new Set(sentTo.map((s) => String(s).toLowerCase()));
          remainingRecipients = remainingRecipients.filter(
            (r) => !sentLower.has(String(r).toLowerCase())
          );

          if (remainingRecipients.length === 0) {
            entry.status = "Sent";
            entry.messageId = collectedMessageIds.join(", ");
            entry.sentTo = deliveredRecipients;
            console.log(`[HTTP EMAIL SUCCESS] Email delivered to ${deliveredRecipients.join(", ")} via HTTP API | ID: ${entry.messageId}`);
            return entry;
          }

          console.warn(
            `[HTTP EMAIL PARTIAL] HTTP delivered to ${sentTo.join(", ")}, but remaining [${remainingRecipients.join(", ")}] will fall back to SMTP.`
          );
        }
      } catch (httpErr) {
        console.warn("[HTTP EMAIL FALLBACK] HTTP API delivery did not complete:", httpErr.message);
      }
    }

    const transporter = getTransporter();
    if (transporter && remainingRecipients.length > 0) {
      const from = getPreferredFromAddress();
      let results = await sendRecipientBatch(transporter, from, remainingRecipients, subject, html, replyTo);
      let failures = results.filter((result) => result.status === "rejected");
      let successes = results.filter((result) => result.status === "fulfilled");

      // Auto-fallback: if all dispatches failed due to network timeout or socket errors,
      // failover to the alternative SMTP port (587 STARTTLS <-> 465 direct SSL)
      if (successes.length === 0 && failures.length > 0) {
        const isNetworkFailure = failures.some((f) => {
          const msg = (f.reason?.message || "").toLowerCase();
          return msg.includes("timeout") || msg.includes("econn") || msg.includes("enetunreach") || msg.includes("esocket");
        });

        if (isNetworkFailure) {
          const currentPort = Number(process.env.SMTP_PORT) || 587;
          const altPort = currentPort === 465 ? 587 : 465;
          const altSecure = altPort === 465;
          console.warn(`[SMTP FAILOVER] Primary dispatch on port ${currentPort} timed out. Retrying on port ${altPort} (secure: ${altSecure})...`);

          const altTransporter = createTransporter(altPort, altSecure);
          const altResults = await sendRecipientBatch(altTransporter, from, remainingRecipients, subject, html, replyTo);
          const altSuccesses = altResults.filter((result) => result.status === "fulfilled");

          if (altSuccesses.length > 0) {
            cachedTransporter = altTransporter; // Switch to the active port for subsequent emails
            results = altResults;
            successes = altSuccesses;
            failures = altResults.filter((result) => result.status === "rejected");
          }
        }
      }

      if (successes.length > 0) {
        const smtpMessageId = successes[0]?.value?.messageId || "";
        if (smtpMessageId) collectedMessageIds.push(smtpMessageId);
        deliveredRecipients.push(...remainingRecipients.filter((_, idx) => results[idx]?.status === "fulfilled"));
        entry.status = "Sent";
        entry.messageId = collectedMessageIds.join(", ");
        entry.sentTo = deliveredRecipients;
        console.log(`[EMAIL SUCCESS] Email sent to ${entry.sentTo.join(", ")} | Subject: "${subject}" | MessageID: ${entry.messageId}`);
      } else {
        entry.status = deliveredRecipients.length > 0 ? "Sent" : "Failed";
        entry.messageId = collectedMessageIds.join(", ");
        entry.sentTo = deliveredRecipients;
        entry.error = failures.map((r) => r.reason?.message || String(r.reason)).join(" | ");
        console.error(`[EMAIL ERROR] Failed to send email to remaining recipients ${remainingRecipients.join(", ")}:`, entry.error);
      }
    } else if (deliveredRecipients.length > 0) {
      entry.status = "Sent";
      entry.messageId = collectedMessageIds.join(", ");
      entry.sentTo = deliveredRecipients;
    } else {
      entry.status = "Skipped";
      console.warn(`[EMAIL SKIPPED] SMTP not configured. Could not send email to ${safeTo}`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n----- EMAIL (not sent, no SMTP configured) -----`);
        console.log(`To: ${safeTo}\nSubject: ${subject}\n${html}`);
        console.log(`--------------------------------------------------\n`);
      }
      return entry;
    }
  } catch (err) {
    entry.status = "Failed";
    entry.error = err.message;
    console.error(`[EMAIL FATAL EXCEPTION] Email send failed to ${safeTo}:`, err.message);
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
  certificateIssued: (name) => ({
    subject: "Your internship certificate is ready",
    html: `<p>Hi ${escapeHtml(name)},</p><p>Congratulations on completing your internship! Your certificate is ready to download from your dashboard.</p>`,
  }),
};


module.exports = { sendEmail, getEmailLog, templates, normalizeRecipientsForDispatch, getPreferredFromAddress, getResendFromAddress };
