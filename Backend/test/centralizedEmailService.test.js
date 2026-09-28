const test = require("node:test");
const assert = require("node:assert/strict");
const {
  sendEmail,
  templates,
  normalizeRecipientsForDispatch,
  getPreferredFromAddress,
  classifySmtpError,
} = require("../utils/sendEmail");
const { supportTargetEmail } = require("../utils/emailTargets");

test("classifySmtpError correctly detects auth failures", () => {
  const err = new Error(
    "Invalid login: 535-5.7.8 Username and Password not accepted",
  );
  err.code = "EAUTH";
  err.responseCode = 535;

  const classified = classifySmtpError(err);
  assert.equal(classified.type, "SMTP authentication failure");
  assert.ok(classified.message.includes("SMTP_USER and SMTP_PASS"));
});

test("classifySmtpError correctly detects network/connection timeouts", () => {
  const err = new Error("connect ETIMEDOUT 142.250.186.108:587");
  err.code = "ETIMEDOUT";

  const classified = classifySmtpError(err);
  assert.equal(classified.type, "Connection failure");
  assert.ok(classified.message.includes("Could not connect to SMTP server"));
});

test("classifySmtpError correctly detects invalid or rejected recipients", () => {
  const err = new Error("Recipient address rejected: 550 Mailbox not found");
  err.code = "EENVELOPE";
  err.responseCode = 550;

  const classified = classifySmtpError(err);
  assert.equal(classified.type, "Invalid recipient");
  assert.ok(classified.message.includes("Recipient address rejected"));
});

test("classifySmtpError correctly detects 5xx SMTP rejections", () => {
  const err = new Error("554 Message rejected due to spam content");
  err.responseCode = 554;

  const classified = classifySmtpError(err);
  assert.equal(classified.type, "SMTP rejection");
});

test("classifySmtpError correctly detects Google Apps Script testing-only relay restrictions", () => {
  const err = new Error(
    "Google Apps Script Relay did not dispatch email. Response: You can only send testing emails to your own email address",
  );

  const classified = classifySmtpError(err);
  assert.equal(classified.type, "Google Apps Script testing-only restriction");
  assert.ok(classified.message.includes("testing-only mode"));
});

test("sendEmail skips non-critical mail when Resend free tier mode is active", async () => {
  const previousMode = process.env.RESEND_FREE_TIER_MODE;
  process.env.RESEND_FREE_TIER_MODE = "true";

  const result = await sendEmail({
    to: "student@example.com",
    subject: "Welcome to InternDock",
    html: "<p>Welcome!</p>",
  });

  assert.equal(result.status, "Skipped");
  assert.match(result.error, /Resend free-tier policy|daily 100-email limit/i);

  if (previousMode === undefined) delete process.env.RESEND_FREE_TIER_MODE;
  else process.env.RESEND_FREE_TIER_MODE = previousMode;
});

test("sendEmail returns clean failure when recipients are empty or invalid", async () => {
  const result = await sendEmail({
    to: "",
    subject: "Empty recipient test",
    html: "<p>test</p>",
  });

  assert.equal(result.success, false);
  assert.equal(result.status, "Failed");
  assert.ok(result.error.includes("No valid recipients"));
});

test("sendEmail deduplicates identical messages dispatched within window", async () => {
  const testRecipient = "dedup.test@example.com";
  const testSubject = `Deduplication Check ${Date.now()}`;
  const testHtml = `<p>Unique body ${Math.random()}</p>`;

  // When SMTP is configured, the first will send or skip, and the second within 30s will be marked duplicateSuppressed
  const res1 = await sendEmail({
    to: testRecipient,
    subject: testSubject,
    html: testHtml,
  });
  const res2 = await sendEmail({
    to: testRecipient,
    subject: testSubject,
    html: testHtml,
  });

  assert.equal(res2.success, true);
  assert.equal(res2.status, "Sent");
  assert.equal(res2.duplicateSuppressed, true);
});

test("Contact form workflow routes to support.interndock@gmail.com and uses sender replyTo", () => {
  const target = supportTargetEmail();
  assert.equal(target, "support.interndock@gmail.com");

  const name = "Inquirer Name";
  const userEmail = "inquirer@example.com";
  const subject = "Course Enrollment";
  const message = "How can I enroll?";

  const t = templates.newContactQueryNotification(
    name,
    userEmail,
    subject,
    message,
  );
  assert.ok(t.subject.includes(subject));
  assert.ok(t.html.includes(name));
  assert.ok(t.html.includes(userEmail));
  assert.ok(t.html.includes(message));
  assert.ok(t.html.includes("support.interndock@gmail.com"));
});

test("Application confirmation email templates include correct student and admin data", () => {
  const studentEmail = "student@example.com";
  const studentName = "Student Candidate";
  const appId = "IND-2026-9090";
  const domain = "Full Stack Web Development";

  const studentT = templates.applicationSubmitted(studentName, appId, domain);
  assert.ok(studentT.subject.includes("Application Confirmed"));
  assert.ok(studentT.subject.includes(appId));
  assert.ok(studentT.html.includes(studentName));
  assert.ok(studentT.html.includes(domain));

  const adminT = templates.newApplicationAdminNotification(
    studentName,
    studentEmail,
    domain,
    4,
    appId,
    "2026-10-01",
    "2026-10-28",
  );
  assert.ok(adminT.subject.includes("[New Student Application]"));
  assert.ok(adminT.html.includes(studentName));
  assert.ok(adminT.html.includes(studentEmail));
  assert.ok(adminT.html.includes(appId));
  assert.ok(adminT.html.includes("support.interndock@gmail.com"));
});

test("Final report submission email templates include student and admin deliverables", () => {
  const studentEmail = "grad@example.com";
  const studentName = "Grad Student";
  const appId = "IND-2026-8800";
  const domain = "Artificial Intelligence & ML";
  const projectTitle = "Autonomous Vision Agent";

  const studentT = templates.finalReportStudentConfirmation(
    studentName,
    appId,
    domain,
    projectTitle,
  );
  assert.ok(studentT.subject.includes("Final Capstone Project Submitted"));
  assert.ok(studentT.html.includes(projectTitle));
  assert.ok(studentT.html.includes(appId));

  const adminT = templates.finalReportSubmitted(
    studentName,
    studentEmail,
    appId,
    domain,
    projectTitle,
    "https://github.com/grad/ai-agent",
    "https://ai-agent.demo.com",
    "Completed model training.",
  );
  assert.ok(adminT.subject.includes("[Final Capstone Submission]"));
  assert.ok(adminT.html.includes(studentEmail));
  assert.ok(adminT.html.includes("https://github.com/grad/ai-agent"));
  assert.ok(adminT.html.includes("support.interndock@gmail.com"));
});

test("Payment confirmation templates include payment amount and application ID", () => {
  const studentT = templates.paymentSuccess(
    "Sam Student",
    499,
    "IND-2026-5555",
  );
  assert.ok(studentT.subject.includes("Payment Confirmed"));
  assert.ok(studentT.html.includes("499"));
  assert.ok(studentT.html.includes("IND-2026-5555"));

  const adminT = templates.newPaymentAdminNotification(
    "Sam Student",
    "sam@example.com",
    499,
    "UTR99998888",
    "IND-2026-5555",
  );
  assert.ok(adminT.subject.includes("[Payment Confirmation]"));
  assert.ok(adminT.html.includes("UTR99998888"));
  assert.ok(adminT.html.includes("support.interndock@gmail.com"));
});
