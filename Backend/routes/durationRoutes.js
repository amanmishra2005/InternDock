const express = require("express");
const router = express.Router();
const Duration = require("../models/Duration");

// GET /api/durations (public, active only)
router.get("/", async (req, res) => {
  const durations = await Duration.find({ isActive: true }).sort({ weeks: 1 });
  res.json(durations);
});

module.exports = router;
