const crypto = require("crypto");

const OTP_EXPIRY_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

function generateOtp() {
  // Generates secure 6-digit random numeric code (100000 to 999999)
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

function getOtpExpirationDate() {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + OTP_EXPIRY_MINUTES);
  return expires;
}

function canResendOtp(lastSentAt) {
  if (!lastSentAt) return { allowed: true };
  const diffMs = Date.now() - new Date(lastSentAt).getTime();
  const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
  if (diffMs < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - diffMs) / 1000);
    return {
      allowed: false,
      remainingSeconds,
      message: `Please wait ${remainingSeconds} second(s) before requesting another verification code.`,
    };
  }
  return { allowed: true };
}

module.exports = {
  generateOtp,
  hashOtp,
  getOtpExpirationDate,
  canResendOtp,
  OTP_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
  MAX_VERIFICATION_ATTEMPTS,
};
