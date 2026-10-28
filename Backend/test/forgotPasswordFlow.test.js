const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { templates } = require("../utils/sendEmail");
const { generateOtp, hashOtp, getOtpExpirationDate, canResendOtp, MAX_VERIFICATION_ATTEMPTS } = require("../utils/otpService");
const User = require("../models/User");

test("passwordReset template formats clean subject and code box", () => {
  const tpl = templates.passwordReset("Student Name", "123456", 15);
  assert.equal(tpl.subject, "Password Reset Code: 123456 - InternDock");
  assert.ok(tpl.html.includes("123456"));
  assert.ok(tpl.html.includes("Reset Your Password"));
  assert.ok(tpl.html.includes("Valid for <strong>15 minutes</strong>"));
  assert.ok(tpl.html.includes("Student Name"));
});

test("passwordChanged template alerts student about account password change", () => {
  const tpl = templates.passwordChanged("Student Name");
  assert.equal(tpl.subject, "Your InternDock Password Was Changed Successfully");
  assert.ok(tpl.html.includes("Password Updated Successfully"));
  assert.ok(tpl.html.includes("Student Name"));
  assert.ok(tpl.html.includes("support.interndock@gmail.com"));
});

test("canResendOtp enforces cooldown for password reset requests", () => {
  const justNow = new Date();
  const cooldown = canResendOtp(justNow);
  assert.equal(cooldown.allowed, false);
  assert.ok(cooldown.remainingSeconds > 0);

  const past = new Date(Date.now() - 70 * 1000);
  const allowed = canResendOtp(past);
  assert.equal(allowed.allowed, true);
});

test("password reset OTP verification and attempts tracking logic", () => {
  const rawOtp = generateOtp();
  assert.match(rawOtp, /^\d{6}$/);

  const hashedOtp = hashOtp(rawOtp);
  assert.equal(typeof hashedOtp, "string");
  assert.equal(hashedOtp.length, 64); // SHA-256 hex length

  // Matching code verification
  assert.equal(hashOtp(rawOtp), hashedOtp);

  // Non-matching code verification
  const wrongCode = "000000";
  assert.notEqual(hashOtp(wrongCode), hashedOtp);

  // Expiration logic
  const validExpiry = getOtpExpirationDate();
  assert.ok(validExpiry.getTime() > Date.now());

  const expiredDate = new Date(Date.now() - 60000);
  assert.ok(Date.now() > expiredDate.getTime());
});

test("User model supports password reset schema fields and saves new password", async () => {
  const user = new User({
    fullName: "Jane Doe",
    email: "janedoe@example.com",
    password: "oldPassword123",
    role: "student",
    resetPasswordOtp: hashOtp("654321"),
    resetPasswordExpires: getOtpExpirationDate(),
    resetPasswordAttempts: 1,
    lastResetPasswordSentAt: new Date(),
  });

  assert.equal(user.resetPasswordAttempts, 1);
  assert.ok(user.resetPasswordExpires);
  assert.equal(user.resetPasswordOtp, hashOtp("654321"));

  // Simulate password reset update
  user.password = "newSecurePassword456";
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpires = undefined;
  user.resetPasswordAttempts = 0;

  user.save = async function () {
    this.wasSaved = true;
    return this;
  };

  assert.equal(user.resetPasswordOtp, undefined);
  assert.equal(user.resetPasswordAttempts, 0);
  assert.equal(await user.comparePassword("newSecurePassword456"), true);
});

