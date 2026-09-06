require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const { createRateLimiter } = require("./utils/rateLimit");

const authRoutes = require("./routes/authRoutes");
const domainRoutes = require("./routes/domainRoutes");
const durationRoutes = require("./routes/durationRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const documentRoutes = require("./routes/documentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (
  isProduction &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_this_to_a_long_random_secret")
) {
  throw new Error("JWT_SECRET must be set to a strong, unique value in production.");
}

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "[CORS WARNING] CLIENT_URL environment variable is not set in production. CORS will allow requests from all origins. Set CLIENT_URL to restrict origins.",
  );
}

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/$/, "");

  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.some((allowed) => {
    const normalizedAllowed = allowed.trim().replace(/\/$/, "");
    if (normalizedAllowed === "*") return true;
    if (normalizedAllowed === normalizedOrigin) return true;

    // Automatic www / apex domain alias matching (e.g., https://interndock.in <-> https://www.interndock.in)
    const altWww = normalizedAllowed.includes("://www.")
      ? normalizedAllowed.replace("://www.", "://")
      : normalizedAllowed.replace("://", "://www.");
    if (altWww === normalizedOrigin) return true;

    if (normalizedAllowed.includes("*")) {
      const pattern =
        "^" +
        normalizedAllowed
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\\\*/g, ".*") +
        "$";
      return new RegExp(pattern, "i").test(normalizedOrigin);
    }
    return false;
  });
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  optionsSuccessStatus: 204,
};

const app = express();
const apiLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 500 });
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
const contactLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 0);
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  });
  if (isProduction) {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(cors(corsOptions));
app.options("(.*)", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "degraded",
    database: databaseReady ? "connected" : "disconnected",
  });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health" || mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    message: "The data service is temporarily unavailable. Please retry shortly.",
    database: "disconnected",
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/durations", durationRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactLimiter, contactRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "Server error",
    ...(!isProduction && !err.status ? { detail: err.message } : {}),
  });
});

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((error) => {
    console.error("API startup failed:", error);
    process.exit(1);
  });
