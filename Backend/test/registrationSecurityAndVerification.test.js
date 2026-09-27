const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateRegistrationEmail,
  isDisposableDomain,
  isValidEmailSyntax,
} = require("../utils/emailValidator");
const {
  checkHoneypot,
  checkSubmissionTiming,
} = require("../utils/antiBot");
const {
  generateOtp,
  hashOtp,
  getOtpExpirationDate,
  canResendOtp,
} = require("../utils/otpService");
const { templates } = require("../utils/sendEmail");
const { protect } = require("../middleware/auth");
const jwt = require("jsonwebtoken");

test("emailValidator rejects disposable and temporary domains", async () => {
  const disposables = [
    "student@mailinator.com",
    "bot@guerrillamail.com",
    "test@10minutemail.com",
    "fake@tempmail.com",
    "temp@yopmail.com",
    "spammer@trashmail.com",
    "subdomain@mail.mailinator.com",
  ];

  for (const email of disposables) {
    const result = await validateRegistrationEmail(email);
    assert.equal(result.isValid, false, `Expected ${email} to be blocked`);
    assert.ok(result.reason.includes("Disposable or temporary email"));
  }
});

test("emailValidator accepts genuine academic and consumer email domains", async () => {
  const validEmails = [
    "alex@gmail.com",
    "rahul@yahoo.co.in",
    "sarah@outlook.com",
    "student@mit.edu",
    "scholar@iitd.ac.in",
    "candidate@university.edu.in",
  ];

  for (const email of validEmails) {
    const result = await validateRegistrationEmail(email);
    assert.equal(result.isValid, true, `Expected ${email} to be valid: ${result.reason}`);
  }
});

test("emailValidator rejects malformed email syntax", async () => {
  const badSyntaxes = [
    "plainaddress",
    "@missingusername.com",
    "username@.com",
    "username@com",
    "",
    null,
    undefined,
  ];

  for (const email of badSyntaxes) {
    const result = await validateRegistrationEmail(email);
    assert.equal(result.isValid, false);
  }
});

test("antiBot traps automated submissions in honeypot decoy fields", () => {
  const humanSubmission = { fullName: "Real Student", email: "student@gmail.com" };
  assert.equal(checkHoneypot(humanSubmission).isBot, false);

  const botWithHpWebsite = { fullName: "Bot Spammer", hp_website: "http://spam.ru" };
  assert.equal(checkHoneypot(botWithHpWebsite).isBot, true);

  const botWithDecoy = { fullName: "Bot Spammer", confirm_email_address: "bot@bot.com" };
  assert.equal(checkHoneypot(botWithDecoy).isBot, true);
});

test("antiBot flags form submissions completed unnaturally fast", () => {
  const now = Date.now();
  // Submitted in 200 milliseconds (bot script)
  const tooFast = checkSubmissionTiming(now - 200, 1.5);
  assert.equal(tooFast.isTooFast, true);

  // Submitted in 4 seconds (human filling fields)
  const normalSpeed = checkSubmissionTiming(now - 4000, 1.5);
  assert.equal(normalSpeed.isTooFast, false);
});

test("otpService generates valid 6-digit numeric codes and secure hashes", () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);

  const hash1 = hashOtp(otp);
  const hash2 = hashOtp(otp);
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64); // SHA-256 hex length
});

test("otpService expiration sets a future timestamp around 15 minutes", () => {
  const expires = getOtpExpirationDate();
  const diffMinutes = (expires.getTime() - Date.now()) / (1000 * 60);
  assert.ok(diffMinutes >= 14 && diffMinutes <= 16);
});

test("otpService enforces 60-second cooldown between resend requests", () => {
  const now = new Date();
  const justSent = canResendOtp(now);
  assert.equal(justSent.allowed, false);
  assert.ok(justSent.remainingSeconds > 0);

  const sentLongAgo = new Date(Date.now() - 65 * 1000);
  const allowedResend = canResendOtp(sentLongAgo);
  assert.equal(allowedResend.allowed, true);
});

test("emailVerification template formats clean subject and code box", () => {
  const t = templates.emailVerification("Alex Student", "482910", 15);
  assert.ok(t.subject.includes("482910"));
  assert.ok(t.html.includes("Alex Student"));
  assert.ok(t.html.includes("482910"));
  assert.ok(t.html.includes("15 minutes"));
});

test("protect middleware rejects unverified accounts with 403 requiresVerification", async () => {
  process.env.JWT_SECRET = "test-secret-key-1234567890";
  const token = jwt.sign({ id: "mock_id", role: "student" }, process.env.JWT_SECRET);

  const mockReq = {
    headers: { authorization: `Bearer ${token}` },
  };

  let responseStatus = 0;
  let responseData = null;
  const mockRes = {
    status(code) {
      responseStatus = code;
      return {
        json(data) {
          responseData = data;
        },
      };
    },
  };

  // Mock User.findById to return an unverified user
  const originalFindById = require("../models/User").findById;
  require("../models/User").findById = async () => ({
    _id: "mock_id",
    email: "student@example.com",
    isActive: true,
    isVerified: false,
  });

  try {
    let nextCalled = false;
    await protect(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, "Should not call next() for unverified user");
    assert.equal(responseStatus, 403);
    assert.equal(responseData?.requiresVerification, true);
    assert.equal(responseData?.email, "student@example.com");
  } finally {
    require("../models/User").findById = originalFindById;
  }
});
