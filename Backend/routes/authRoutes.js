const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendEmail, templates } = require("../utils/sendEmail");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sanitize(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, college, course, branch } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({ fullName, email, password, phone, college, course, branch });
    const t = templates.welcome(user.fullName);
    sendEmail({ to: user.email, ...t }).catch(() => {});

    return res.status(201).json({ user: sanitize(user), token: signToken(user) });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Unable to create the account." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled" });

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
