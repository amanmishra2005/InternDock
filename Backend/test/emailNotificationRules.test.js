const test = require("node:test");
const assert = require("node:assert/strict");
const { templates } = require("../utils/sendEmail");

test("application templates produce valid confirmation emails for student and admin", () => {
  const studentEmail = templates.applicationSubmitted("Alice Test", "IND-2026-9999", "Full Stack Web Development");
  assert.ok(studentEmail.subject.includes("Application Confirmed"));
  assert.ok(studentEmail.subject.includes("IND-2026-9999"));
  assert.ok(studentEmail.html.includes("Alice Test"));
  assert.ok(studentEmail.html.includes("Full Stack Web Development"));
  assert.ok(studentEmail.html.includes("support.interndock@gmail.com"));

  const adminEmail = templates.newApplicationAdminNotification(
    "Alice Test",
    "alice@example.com",
    "Full Stack Web Development",
    4,
    "IND-2026-9999",
    "2026-10-01",
    "2026-10-29"
  );
  assert.ok(adminEmail.subject.includes("[New Student Application]"));
  assert.ok(adminEmail.html.includes("support.interndock@gmail.com"));
});

test("payment templates produce valid receipt emails for student and admin", () => {
  const studentEmail = templates.paymentSuccess("Bob Test", 499, "IND-2026-8888");
  assert.ok(studentEmail.subject.includes("Payment Confirmed"));
  assert.ok(studentEmail.html.includes("499"));
  assert.ok(studentEmail.html.includes("IND-2026-8888"));

  const adminEmail = templates.newPaymentAdminNotification(
    "Bob Test",
    "bob@example.com",
    499,
    "UPI12345678",
    "IND-2026-8888"
  );
  assert.ok(adminEmail.subject.includes("[Payment Confirmation]"));
  assert.ok(adminEmail.html.includes("UPI12345678"));
});

test("final capstone project templates produce valid confirmation emails for student and admin", () => {
  const studentEmail = templates.finalReportStudentConfirmation(
    "Charlie Test",
    "IND-2026-7777",
    "Data Science & AI",
    "Deep Learning Fraud Detection"
  );
  assert.ok(studentEmail.subject.includes("Final Capstone Project Submitted"));
  assert.ok(studentEmail.html.includes("Charlie Test"));
  assert.ok(studentEmail.html.includes("Deep Learning Fraud Detection"));
  assert.ok(studentEmail.html.includes("interndock.in/verify"));

  const adminEmail = templates.finalReportSubmitted(
    "Charlie Test",
    "charlie@example.com",
    "IND-2026-7777",
    "Data Science & AI",
    "Deep Learning Fraud Detection",
    "https://github.com/charlie/fraud-detect",
    "https://fraud-detect.demo.com",
    "Built a production fraud detector."
  );
  assert.ok(adminEmail.subject.includes("[Final Capstone Submission]"));
  assert.ok(adminEmail.html.includes("https://github.com/charlie/fraud-detect"));
  assert.ok(adminEmail.html.includes("support.interndock@gmail.com"));
});
