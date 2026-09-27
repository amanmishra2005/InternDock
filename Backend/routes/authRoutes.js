const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendEmail, templates } = require("../utils/sendEmail");
const { validateRegistrationEmail } = require("../utils/emailValidator");
const { validateRegistrationAntiBot } = require("../utils/antiBot");
const {
  generateOtp,
  hashOtp,
  getOtpExpirationDate,
  canResendOtp,
  OTP_EXPIRY_MINUTES,
  MAX_VERIFICATION_ATTEMPTS,
} = require("../utils/otpService");
const { createRateLimiter } = require("../utils/rateLimit");

// Specific rate limiters for anti-spam & abuse defense
const registerLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8 });
const verifyEmailLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 15 });
const resendOtpLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.verificationCode;
  delete obj.verificationCodeExpires;
  delete obj.verificationAttempts;
  delete obj.lastVerificationSentAt;
  return obj;
}

// POST /api/auth/register
// Multi-layer security: Anti-bot check -> Disposable email check -> OTP generation -> Email verification trigger
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { fullName, email, password, phone, college, course, branch } = req.body;

    // 1. Basic Presence Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email address, and password are required." });
    }

    const cleanFullName = String(fullName).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (!cleanFullName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: "Full name, email address, and password are required." });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // 2. Anti-Bot & CAPTCHA Validation (Turnstile, Honeypot, Timing)
    const antiBot = await validateRegistrationAntiBot(req);
    if (!antiBot.passed) {
      return res.status(antiBot.status || 400).json({ message: antiBot.message });
    }

    // 3. Email Security: Syntax, Disposable Providers Blocklist, DNS MX check
    const emailValidation = await validateRegistrationEmail(cleanEmail);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.reason });
    }

    // 4. Duplicate Account Check
    const existing = await User.findOne({ email: cleanEmail })
      .select("+verificationCode +verificationCodeExpires +verificationAttempts +lastVerificationSentAt");

    if (existing) {
      // If already verified, reject duplicate registration
      if (existing.isVerified) {
        return res.status(409).json({ message: "This email address is already registered. Please sign in." });
      }

      // If registered but not verified yet, issue a fresh OTP code
      const cooldown = canResendOtp(existing.lastVerificationSentAt);
      if (!cooldown.allowed) {
        return res.status(429).json({
          message: cooldown.message,
          requiresVerification: true,
          email: cleanEmail,
        });
      }

      const otp = generateOtp();
      existing.verificationCode = hashOtp(otp);
      existing.verificationCodeExpires = getOtpExpirationDate();
      existing.verificationAttempts = 0;
      existing.lastVerificationSentAt = new Date();
      if (cleanPassword) {
        existing.password = cleanPassword;
      }
      await existing.save();

      const otpTemplate = templates.emailVerification(cleanFullName, otp, OTP_EXPIRY_MINUTES);
      sendEmail({ to: cleanEmail, replyTo: "support.interndock@gmail.com", ...otpTemplate })
        .then((res) => {
          console.log(`[VERIFICATION EMAIL SENT] Resent OTP to ${cleanEmail} (ID: ${res?.messageId})`);
        })
        .catch((err) => {
          console.error(`[VERIFICATION EMAIL ERROR] Failed to send OTP to ${cleanEmail}:`, err.message);
        });

      return res.status(200).json({
        success: true,
        message: "A new 6-digit verification code has been sent to your email.",
        requiresVerification: true,
        email: cleanEmail,
      });
    }

    // 5. Create New Unverified Account with 6-Digit OTP
    const otp = generateOtp();
    const user = await User.create({
      fullName: cleanFullName,
      email: cleanEmail,
      password: cleanPassword,
      phone: phone ? String(phone).trim() : "",
      college: college ? String(college).trim() : "",
      course: course ? String(course).trim() : "",
      branch: branch ? String(branch).trim() : "",
      isVerified: false,
      verificationCode: hashOtp(otp),
      verificationCodeExpires: getOtpExpirationDate(),
      verificationAttempts: 0,
      lastVerificationSentAt: new Date(),
    });

    // 6. Dispatch Verification Code Email
    const otpTemplate = templates.emailVerification(user.fullName, otp, OTP_EXPIRY_MINUTES);
    sendEmail({ to: user.email, replyTo: "support.interndock@gmail.com", ...otpTemplate })
      .then((res) => {
        console.log(`[VERIFICATION EMAIL SENT] Initial OTP dispatched to ${user.email} (ID: ${res?.messageId})`);
      })
      .catch((err) => {
        console.error(`[VERIFICATION EMAIL ERROR] Failed initial OTP to ${user.email}:`, err.message);
      });

    return res.status(201).json({
      success: true,
      message: "Account registered successfully! Please enter the 6-digit code sent to your email to activate your account.",
      requiresVerification: true,
      email: cleanEmail,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Unable to create the account. Please try again." });
  }
});

// POST /api/auth/verify-email
// Validates 6-digit OTP and activates the user account
router.post("/verify-email", verifyEmailLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanCode = String(code || "").trim();

    if (!cleanEmail || !cleanCode) {
      return res.status(400).json({ message: "Email and verification code are required." });
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ message: "Please enter a valid 6-digit numerical code." });
    }

    const user = await User.findOne({ email: cleanEmail })
      .select("+verificationCode +verificationCodeExpires +verificationAttempts");

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified. You may sign in.",
        user: sanitize(user),
        token: signToken(user),
      });
    }

    // Attempt lockout check
    if ((user.verificationAttempts || 0) >= MAX_VERIFICATION_ATTEMPTS) {
      return res.status(400).json({
        message: "Too many incorrect attempts. Please request a new verification code.",
      });
    }

    // Expiration check
    if (!user.verificationCodeExpires || new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({
        message: "Verification code has expired. Please click 'Resend Code' to receive a new one.",
      });
    }

    // Verify OTP hash
    const inputHash = hashOtp(cleanCode);
    if (inputHash !== user.verificationCode) {
      user.verificationAttempts = (user.verificationAttempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - user.verificationAttempts);
      return res.status(400).json({
        message: remaining > 0
          ? `Invalid verification code. ${remaining} attempt(s) remaining.`
          : "Too many incorrect attempts. Please request a new code.",
      });
    }

    // Verification Success: Activate Account
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.verificationAttempts = 0;
    await user.save();

    console.log(`[ACCOUNT ACTIVATED] User ${user.email} successfully verified and activated.`);

    // Dispatch welcome email
    const welcomeTemplate = templates.welcome(user.fullName);
    sendEmail({ to: user.email, replyTo: "support.interndock@gmail.com", ...welcomeTemplate }).catch(() => {});

    return res.json({
      success: true,
      message: "Email verified successfully! Welcome to InternDock.",
      user: sanitize(user),
      token: signToken(user),
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ message: "Error verifying email code." });
  }
});

// POST /api/auth/resend-verification
// Resends a fresh 6-digit OTP code to unverified accounts (rate-limited)
router.post("/resend-verification", resendOtpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: "Email address is required." });
    }

    const user = await User.findOne({ email: cleanEmail })
      .select("+verificationCode +verificationCodeExpires +verificationAttempts +lastVerificationSentAt");

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified. Please sign in." });
    }

    const cooldown = canResendOtp(user.lastVerificationSentAt);
    if (!cooldown.allowed) {
      return res.status(429).json({ message: cooldown.message });
    }

    const otp = generateOtp();
    user.verificationCode = hashOtp(otp);
    user.verificationCodeExpires = getOtpExpirationDate();
    user.verificationAttempts = 0;
    user.lastVerificationSentAt = new Date();
    await user.save();

    const otpTemplate = templates.emailVerification(user.fullName, otp, OTP_EXPIRY_MINUTES);
    sendEmail({ to: user.email, replyTo: "support.interndock@gmail.com", ...otpTemplate })
      .then((res) => {
        console.log(`[VERIFICATION RESENT] New OTP delivered to ${user.email} (ID: ${res?.messageId})`);
      })
      .catch((err) => {
        console.error(`[VERIFICATION RESEND ERROR] Failed to send to ${user.email}:`, err.message);
      });

    return res.json({
      success: true,
      message: `A fresh 6-digit verification code has been sent to ${cleanEmail}.`,
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ message: "Unable to resend verification code." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();

    if (!cleanEmail || !cleanPassword || cleanEmail.length > 254 || cleanPassword.length < 8) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user || !(await user.comparePassword(cleanPassword))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled" });

    // Mandatory Email Verification Check
    if (user.isVerified === false) {
      return res.status(403).json({
        message: "Email verification required before accessing your account.",
        requiresVerification: true,
        email: user.email,
      });
    }

    return res.json({ user: sanitize(user), token: signToken(user) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Unable to sign in." });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: sanitize(req.user) });
});

// PUT /api/auth/me
router.put("/me", protect, async (req, res) => {
  try {
    const allowed = [
      "fullName", "phone", "college", "course", "branch", "currentYear",
      "graduationYear", "studentIdNumber", "city", "state", "country",
      "skills", "github", "linkedin", "profilePhotoUrl",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });
    await req.user.save();
    res.json({ user: sanitize(req.user) });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Unable to update the profile." });
  }
});

module.exports = router;
