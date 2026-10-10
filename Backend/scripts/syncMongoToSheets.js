#!/usr/bin/env node
/**
 * InternDock MongoDB to Google Sheets Sync Utility
 *
 * 1. Fetches authentic live records directly from MongoDB Atlas
 * 2. Clears stale rows in Google Sheets (preserving sleek headers)
 * 3. Pushes fresh MongoDB records directly into their respective tabs
 *
 * Usage:
 *   node scripts/syncMongoToSheets.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Application = require("../models/Application");
const Payment = require("../models/Payment");
const OfferLetter = require("../models/OfferLetter");
const Submission = require("../models/Submission");
const FinalReport = require("../models/FinalReport");
const Certificate = require("../models/Certificate");
const ContactQuery = require("../models/ContactQuery");
const User = require("../models/User");
const Domain = require("../models/Domain");
const Duration = require("../models/Duration");
const Assignment = require("../models/Assignment");

const {
  appendToSpreadsheet,
  resolveSheetSchema,
  ALLOWED_SHEETS,
} = require("../utils/spreadsheetStorage");

const WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
const WEBHOOK_TOKEN = process.env.GOOGLE_SHEET_WEBHOOK_TOKEN || "";
const MONGO_URI = process.env.MONGO_URI || "";
const LEDGER_DIR =
  process.env.LEDGER_DIR ||
  path.join(__dirname, "..", "uploads", "spreadsheet_ledger");

async function clearGoogleSheets() {
  if (!WEBHOOK_URL) return;
  console.log("🧹 Clearing old data rows in Google Sheets (preserving headers)...");
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "clear_all",
        webhookToken: WEBHOOK_TOKEN,
      }),
    });
    const text = await res.text();
    console.log("Sheet clear response:", text);
  } catch (err) {
    console.warn("Could not call clear_all webhook:", err.message);
  }
}

function clearLocalLedgerFiles() {
  console.log("🧹 Resetting local CSV ledger files to clean headers...");
  try {
    if (fs.existsSync(LEDGER_DIR)) {
      for (const sheetName of ALLOWED_SHEETS) {
        const schema = resolveSheetSchema(sheetName);
        if (!schema) continue;
        const filePath = path.join(LEDGER_DIR, `${schema.name}.csv`);
        const headerRow = schema.columns.map((c) => `"${c.header}"`).join(",") + "\n";
        fs.writeFileSync(filePath, headerRow, "utf8");
      }
    }
  } catch (e) {
    console.warn("Local ledger clear notice:", e.message);
  }
}

async function run() {
  console.log("\n==================================================");
  console.log("  InternDock MongoDB -> Google Sheets Sync Tool");
  console.log("==================================================\n");

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing in Backend/.env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ Successfully connected to MongoDB Atlas!\n");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    if (
      err.message.includes("whitelist") ||
      err.message.includes("ServerSelectionError") ||
      err.message.includes("ReplicaSetNoPrimary")
    ) {
      console.log("\n⚠️  ACTION REQUIRED ON MONGODB ATLAS:");
      console.log("Your current IP address is not whitelisted in MongoDB Atlas.");
      console.log("1. Open https://cloud.mongodb.com/");
      console.log("2. Go to Security > Network Access.");
      console.log("3. Click 'Add IP Address' > Add '0.0.0.0/0' (or current IP: 14.139.240.85).");
      console.log("4. Once saved in Atlas, run: npm run sync:mongo\n");
    }
    process.exit(1);
  }

  // 1. Clear existing rows in Google Sheets and local CSVs
  await clearGoogleSheets();
  clearLocalLedgerFiles();

  let totalSynced = 0;

  try {
    // --- 1. APPLICATIONS ---
    console.log("\nFetching Applications from MongoDB...");
    const applications = await Application.find()
      .populate("student")
      .populate("domain")
      .populate("duration")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${applications.length} applications in MongoDB.`);
    for (const app of applications) {
      const student = app.student || {};
      const domain = app.domain || {};
      const duration = app.duration || {};

      await appendToSpreadsheet("applications", {
        applicationId: app.applicationId || "-",
        studentName: app.studentName || student.fullName || "-",
        studentEmail: app.studentEmail || student.email || "-",
        phoneNumber: student.phone || "-",
        collegeName: app.collegeName || student.college || "-",
        degree: student.branch ? `${student.course || ""} ${student.branch}`.trim() : student.course || "-",
        graduationYear: student.graduationYear || "-",
        domainName: domain.name || "-",
        durationLabel: duration.label || (duration.weeks ? `${duration.weeks} Weeks Track` : "-"),
        startDate: app.startDate,
        endDate: app.endDate,
        fee: duration.fee || 0,
        paymentStatus: app.paymentStatus || "Pending",
        status: app.status || "Submitted",
        timestamp: app.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    // --- 2. PAYMENTS ---
    console.log("\nFetching Payments from MongoDB...");
    const payments = await Payment.find()
      .populate("application")
      .populate("student")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${payments.length} payments in MongoDB.`);
    for (const pay of payments) {
      const app = pay.application || {};
      const student = pay.student || {};

      await appendToSpreadsheet("payments", {
        applicationId: app.applicationId || "-",
        studentName: pay.payerName || student.fullName || "-",
        studentEmail: pay.registeredEmail || student.email || "-",
        domainName: "-",
        amount: pay.amount || 0,
        paymentStatus: pay.status || "Pending",
        utrNumber: pay.utrNumber || pay.paymentId || "-",
        payerName: pay.payerName || student.fullName || "-",
        orderId: pay.orderId || "-",
        timestamp: pay.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    // --- 3. OFFER LETTERS ---
    console.log("\nFetching Offer Letters from MongoDB...");
    const offerLetters = await OfferLetter.find()
      .populate({ path: "application", populate: ["domain", "duration"] })
      .populate("student")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${offerLetters.length} offer letters in MongoDB.`);
    for (const offer of offerLetters) {
      const app = offer.application || {};
      const student = offer.student || {};

      await appendToSpreadsheet("offer_letters", {
        referenceId: offer.referenceId || "-",
        applicationId: app.applicationId || "-",
        studentName: student.fullName || app.studentName || "-",
        studentEmail: student.email || app.studentEmail || "-",
        collegeName: student.college || app.collegeName || "-",
        domainName: app.domain?.name || "-",
        durationLabel: app.duration?.label || `${app.duration?.weeks || 4} Weeks Track`,
        startDate: app.startDate,
        endDate: app.endDate,
        issueDate: offer.issueDate || offer.createdAt,
        verificationId: offer.verificationId || "-",
        timestamp: offer.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    // --- 4. SUBMISSIONS ---
    console.log("\nFetching Submissions from MongoDB...");
    const submissions = await Submission.find()
      .populate("application")
      .populate("student")
      .populate("assignment")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${submissions.length} submissions in MongoDB.`);
    for (const sub of submissions) {
      const app = sub.application || {};
      const student = sub.student || {};
      const assignment = sub.assignment || {};

      await appendToSpreadsheet("submissions", {
        applicationId: app.applicationId || "-",
        studentName: student.fullName || app.studentName || "-",
        studentEmail: student.email || app.studentEmail || "-",
        domainName: "-",
        taskNumber: assignment.week ? `Week ${assignment.week}` : "-",
        taskTitle: assignment.title || "-",
        githubUrl: sub.githubUrl || "-",
        liveUrl: sub.liveUrl || "-",
        status: sub.status || "Submitted",
        notes: sub.textContent || sub.feedback || "-",
        timestamp: sub.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    // --- 5. FINAL REPORTS ---
    console.log("\nFetching Final Capstone Reports from MongoDB...");
    const finalReports = await FinalReport.find()
      .populate("application")
      .populate("student")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${finalReports.length} final reports in MongoDB.`);
    for (const rep of finalReports) {
      const app = rep.application || {};
      const student = rep.student || {};

      await appendToSpreadsheet("final_projects", {
        applicationId: app.applicationId || "-",
        studentName: student.fullName || app.studentName || "-",
        studentEmail: student.email || app.studentEmail || "-",
        collegeName: student.college || app.collegeName || "-",
        domainName: "-",
        projectTitle: rep.title || "-",
        githubUrl: rep.githubUrl || "-",
        liveUrl: rep.liveUrl || "-",
        executiveSummary: rep.conclusion || rep.objectives || "-",
        status: rep.status || "Submitted",
        timestamp: rep.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    // --- 6. CERTIFICATES ---
    console.log("\nFetching Certificates from MongoDB...");
    const certificates = await Certificate.find()
      .populate({ path: "application", populate: ["domain", "duration"] })
      .populate("student")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${certificates.length} certificates in MongoDB.`);
    for (const cert of certificates) {
      const app = cert.application || {};
      const student = cert.student || {};

      await appendToSpreadsheet("certificates", {
        certificateId: cert.certificateId || "-",
        applicationId: app.applicationId || "-",
        studentName: student.fullName || app.studentName || "-",
        studentEmail: student.email || app.studentEmail || "-",
        collegeName: student.college || app.collegeName || "-",
        domainName: app.domain?.name || "-",
        durationLabel: app.duration?.label || `${app.duration?.weeks || 4} Weeks Track`,
        startDate: app.startDate,
        endDate: app.endDate,
        issueDate: cert.issueDate || cert.createdAt,
        verificationId: cert.verificationId || "-",
        timestamp: cert.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    // --- 7. CONTACT QUERIES ---
    console.log("\nFetching Contact Queries from MongoDB...");
    const contactQueries = await ContactQuery.find()
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${contactQueries.length} contact queries in MongoDB.`);
    for (const query of contactQueries) {
      await appendToSpreadsheet("contact_queries", {
        name: query.name || "-",
        email: query.email || "-",
        subject: query.subject || "General Inquiry",
        message: query.message || "-",
        status: query.status || "Pending",
        timestamp: query.createdAt || new Date(),
      });
      totalSynced++;
      await new Promise((r) => setTimeout(r, 150));
    }

    console.log(`\n🎉 DONE: Synchronized ${totalSynced} authentic MongoDB records to Google Sheets!`);
  } catch (err) {
    console.error("Error during sync:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
