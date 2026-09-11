const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "Backend", ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("../Backend/config/db");

const authRoutes = require("../Backend/routes/authRoutes");
const domainRoutes = require("../Backend/routes/domainRoutes");
const durationRoutes = require("../Backend/routes/durationRoutes");
const applicationRoutes = require("../Backend/routes/applicationRoutes");
const assignmentRoutes = require("../Backend/routes/assignmentRoutes");
const paymentRoutes = require("../Backend/routes/paymentRoutes");
const documentRoutes = require("../Backend/routes/documentRoutes");
const adminRoutes = require("../Backend/routes/adminRoutes");
const contactRoutes = require("../Backend/routes/contactRoutes");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

let dbPromise = null;
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!dbPromise) {
        dbPromise = connectDB();
      }
      await dbPromise;
    }
    next();
  } catch (err) {
    console.error("Vercel DB connection error:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "connecting" });
});

app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/durations", durationRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

module.exports = app;
