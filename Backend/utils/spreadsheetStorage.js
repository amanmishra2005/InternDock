const fs = require("fs");
const path = require("path");

const LEDGER_DIR = process.env.LEDGER_DIR || path.join(__dirname, "..", "uploads", "spreadsheet_ledger");
const writeQueues = new Map();

if (!fs.existsSync(LEDGER_DIR)) {
  fs.mkdirSync(LEDGER_DIR, { recursive: true });
}

function formatTimestamp(d = new Date()) {
  const dateObj = d instanceof Date && !isNaN(d.getTime()) ? d : new Date();
  return dateObj.toISOString().replace("T", " ").slice(0, 19);
}

function formatDateString(val) {
  if (!val) return "-";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return String(val);
  }
}

// Convert column header ("Application ID") to camelCase alias ("applicationId")
function headerToCamelCase(header) {
  return String(header)
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((word, idx) => (idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join("");
}

// Canonical schema definitions for each allowed business sheet
// Only essential, future-useful, human-readable columns are preserved.
const SHEET_SCHEMAS = {
  applications: {
    name: "applications",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Application ID", get: (r) => r.applicationId || "-" },
      { header: "Student Name", get: (r) => r.studentName || "-" },
      { header: "Student Email", get: (r) => r.studentEmail || r.email || "-" },
      { header: "Phone Number", get: (r) => r.phoneNumber || r.phone || "-" },
      { header: "College / University", get: (r) => r.collegeName || r.college || "-" },
      { header: "Degree / Branch", get: (r) => r.degree || "-" },
      { header: "Graduation Year", get: (r) => r.graduationYear || "-" },
      { header: "Internship Domain", get: (r) => r.domainName || r.domain || "-" },
      { header: "Track Duration", get: (r) => r.durationLabel || (r.durationWeeks ? `${r.durationWeeks} Weeks Track` : "-") },
      { header: "Start Date", get: (r) => formatDateString(r.startDate) },
      { header: "End Date", get: (r) => formatDateString(r.endDate) },
      { header: "Program Fee (INR)", get: (r) => (r.fee !== undefined ? r.fee : r.amount || 0) },
      { header: "Payment Status", get: (r) => r.paymentStatus || "Pending" },
      { header: "Application Status", get: (r) => r.status || "Submitted" },
    ],
  },
  payments: {
    name: "payments",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Application ID", get: (r) => r.applicationId || "-" },
      { header: "Student Name", get: (r) => r.studentName || "-" },
      { header: "Student Email", get: (r) => r.studentEmail || r.registeredEmail || r.email || "-" },
      { header: "Internship Domain", get: (r) => r.domainName || r.domain || "-" },
      { header: "Amount (INR)", get: (r) => (r.amount !== undefined ? r.amount : r.fee || 0) },
      { header: "Payment Status", get: (r) => r.status || r.paymentStatus || "Pending" },
      { header: "UTR / Transaction ID", get: (r) => r.utrNumber || r.paymentId || "-" },
      { header: "Payer Name", get: (r) => r.payerName || r.studentName || "-" },
      { header: "Order ID", get: (r) => r.orderId || "-" },
    ],
  },
  offer_letters: {
    name: "offer_letters",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Offer Reference ID", get: (r) => r.referenceId || r.offerReferenceId || "-" },
      { header: "Application ID", get: (r) => r.applicationId || "-" },
      { header: "Student Name", get: (r) => r.studentName || "-" },
      { header: "Student Email", get: (r) => r.studentEmail || r.email || "-" },
      { header: "College / University", get: (r) => r.collegeName || r.college || "-" },
      { header: "Internship Domain", get: (r) => r.domainName || r.domain || "-" },
      { header: "Track Duration", get: (r) => r.durationLabel || "-" },
      { header: "Start Date", get: (r) => formatDateString(r.startDate) },
      { header: "End Date", get: (r) => formatDateString(r.endDate) },
      { header: "Issue Date", get: (r) => formatDateString(r.issueDate) },
      { header: "Verification ID", get: (r) => r.verificationId || "-" },
    ],
  },
  submissions: {
    name: "submissions",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Application ID", get: (r) => r.applicationId || "-" },
      { header: "Student Name", get: (r) => r.studentName || "-" },
      { header: "Student Email", get: (r) => r.studentEmail || r.email || "-" },
      { header: "Internship Domain", get: (r) => r.domainName || r.domain || "-" },
      { header: "Task Number", get: (r) => r.taskNumber || r.assignmentNumber || "-" },
      { header: "Task Title", get: (r) => r.taskTitle || r.assignmentTitle || r.title || "-" },
      { header: "GitHub URL", get: (r) => r.githubUrl || "-" },
      { header: "Live Demo URL", get: (r) => r.liveUrl || r.hostedUrl || "-" },
      { header: "Submission Status", get: (r) => r.status || "Submitted" },
      { header: "Notes / Comments", get: (r) => r.notes || r.textContent || "-" },
    ],
  },
  final_projects: {
    name: "final_projects",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Application ID", get: (r) => r.applicationId || "-" },
      { header: "Student Name", get: (r) => r.studentName || "-" },
      { header: "Student Email", get: (r) => r.studentEmail || r.email || "-" },
      { header: "College / University", get: (r) => r.collegeName || r.college || "-" },
      { header: "Internship Domain", get: (r) => r.domainName || r.domain || "-" },
      { header: "Project Title", get: (r) => r.projectTitle || r.title || "-" },
      { header: "GitHub Repository URL", get: (r) => r.githubUrl || "-" },
      { header: "Hosted Live Demo URL", get: (r) => r.liveUrl || r.hostedUrl || "-" },
      { header: "Executive Summary", get: (r) => r.executiveSummary || r.textContent || "-" },
      { header: "Project Status", get: (r) => r.status || "Submitted" },
    ],
  },
  certificates: {
    name: "certificates",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Certificate ID", get: (r) => r.certificateId || "-" },
      { header: "Application ID", get: (r) => r.applicationId || "-" },
      { header: "Student Name", get: (r) => r.studentName || "-" },
      { header: "Student Email", get: (r) => r.studentEmail || r.email || "-" },
      { header: "College / University", get: (r) => r.collegeName || r.college || "-" },
      { header: "Internship Domain", get: (r) => r.domainName || r.domain || "-" },
      { header: "Track Duration", get: (r) => r.durationLabel || "-" },
      { header: "Start Date", get: (r) => formatDateString(r.startDate) },
      { header: "End Date", get: (r) => formatDateString(r.endDate) },
      { header: "Issue Date", get: (r) => formatDateString(r.issueDate) },
      { header: "Verification ID", get: (r) => r.verificationId || "-" },
    ],
  },
  contact_queries: {
    name: "contact_queries",
    columns: [
      { header: "Timestamp", get: (r) => formatTimestamp(r.timestamp) },
      { header: "Name", get: (r) => r.name || r.studentName || "-" },
      { header: "Email", get: (r) => r.email || r.studentEmail || "-" },
      { header: "Subject", get: (r) => r.subject || "General Inquiry" },
      { header: "Message", get: (r) => r.message || "-" },
      { header: "Status", get: (r) => r.status || "New" },
    ],
  },
};

// Aliases mapping user requests and variations to canonical sheet names
const SHEET_NAME_ALIASES = {
  application: "applications",
  applications: "applications",
  payment: "payments",
  payments: "payments",
  offerletter: "offer_letters",
  offerletters: "offer_letters",
  offer_letter: "offer_letters",
  offer_letters: "offer_letters",
  submission: "submissions",
  submissions: "submissions",
  finalreport: "final_projects",
  finalreports: "final_projects",
  final_report: "final_projects",
  final_reports: "final_projects",
  finalproject: "final_projects",
  finalprojects: "final_projects",
  final_project: "final_projects",
  final_projects: "final_projects",
  certificate: "certificates",
  certificates: "certificates",
  contactquery: "contact_queries",
  contactqueries: "contact_queries",
  contact_query: "contact_queries",
  contact_queries: "contact_queries",
};

const ALLOWED_SHEETS = new Set(Object.values(SHEET_NAME_ALIASES));

function resolveSheetSchema(sheetName) {
  const normalized = String(sheetName || "").trim().toLowerCase();
  const canonical = SHEET_NAME_ALIASES[normalized];
  if (!canonical) return null;
  return SHEET_SCHEMAS[canonical];
}

function sanitizeAndFormatRecord(sheetName, rawData = {}) {
  const schema = resolveSheetSchema(sheetName);
  if (!schema) return null;

  const recordWithTimestamp = {
    timestamp: rawData.timestamp || new Date(),
    ...rawData,
  };

  const formatted = {};
  schema.columns.forEach((col) => {
    const val = col.get(recordWithTimestamp);
    formatted[col.header] = val !== undefined && val !== null ? val : "-";
  });

  return {
    canonicalSheetName: schema.name,
    data: formatted,
  };
}

async function syncToGoogleSheet(sheetName, recordData) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
  if (!webhookUrl) return { ok: false, reason: "missing webhook URL" };

  const webhookToken = process.env.GOOGLE_SHEET_WEBHOOK_TOKEN || undefined;
  const timeoutMs = Number(process.env.GOOGLE_SHEET_SYNC_TIMEOUT_MS) || 10000;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheetName,
        ...recordData,
        webhookToken,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, reason: `HTTP ${response.status}: ${text}` };
    }

    return { ok: true, reason: "synced" };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function formatCsvLine(dataObject) {
  return Object.values(dataObject)
    .map((val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    })
    .join(",");
}

function ensureFileHeaderMatchesSchema(filePath, expectedHeaders) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const currentHeaders = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
    const matches = currentHeaders.length === expectedHeaders.length && currentHeaders.every((h, i) => h === expectedHeaders[i]);
    if (matches) return;

    // Header mismatch detected: upgrade CSV file to canonical schema
    const newLines = [expectedHeaders.map((h) => `"${h}"`).join(",")];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((v) => v.replace(/^"|"$/g, ""));
      if (values.length === expectedHeaders.length) {
        newLines.push(lines[i]);
      } else {
        const oldRow = {};
        currentHeaders.forEach((h, idx) => {
          oldRow[h] = values[idx] || "";
          const camel = headerToCamelCase(h);
          if (camel) oldRow[camel] = values[idx] || "";
        });

        const remapped = expectedHeaders.map((header) => {
          const camel = headerToCamelCase(header);
          let val = oldRow[header] || oldRow[camel];
          if (val === undefined || val === null || val === "") {
            if (header === "Program Fee (INR)") val = oldRow.fee || oldRow.amount || 0;
            else if (header === "Track Duration") val = oldRow.durationWeeks ? `${oldRow.durationWeeks} Weeks Track` : (oldRow.durationLabel || "-");
            else if (header === "Internship Domain") val = oldRow.domainName || oldRow.domain || "-";
            else if (header === "Application ID") val = oldRow.applicationId || "-";
            else if (header === "Student Name") val = oldRow.studentName || "-";
            else if (header === "Student Email") val = oldRow.studentEmail || oldRow.email || "-";
            else if (header === "Payment Status") val = oldRow.paymentStatus || "Pending";
            else if (header === "Application Status") val = oldRow.status || "Submitted";
            else val = "-";
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        newLines.push(remapped.join(","));
      }
    }

    fs.writeFileSync(filePath, newLines.join("\n") + "\n", "utf8");
  } catch (err) {
    console.error(`Failed to reconcile headers for ${filePath}:`, err.message);
  }
}

/**
 * Appends a clean, formatted, human-readable record to the spreadsheet.
 * Strictly ignores any non-allowed or email logging sheet names.
 */
function appendToSpreadsheet(sheetName, recordData) {
  const sanitized = sanitizeAndFormatRecord(sheetName, recordData);
  if (!sanitized) {
    console.warn(`[SPREADSHEET WARNING] Sheet "${sheetName}" is not an allowed business ledger. Ignoring append.`);
    return Promise.resolve(false);
  }

  const { canonicalSheetName, data: cleanRecord } = sanitized;
  const canonicalHeaders = Object.keys(cleanRecord);

  const previous = writeQueues.get(canonicalSheetName) || Promise.resolve();
  const write = previous
    .catch(() => {})
    .then(async () => {
      // 1. Synchronize to Google Sheets webhook
      const cloudResult = await syncToGoogleSheet(canonicalSheetName, cleanRecord);
      if (!cloudResult.ok) {
        if (cloudResult.reason !== "missing webhook URL") {
          console.warn(`Google Sheets sync notice for ${canonicalSheetName}: ${cloudResult.reason}`);
        }
      }

      // 2. Append to local CSV mirror with human-readable headers
      await fs.promises.mkdir(LEDGER_DIR, { recursive: true });
      const filePath = path.join(LEDGER_DIR, `${canonicalSheetName}.csv`);
      const fileExists = fs.existsSync(filePath);

      if (!fileExists) {
        const headers = canonicalHeaders.map((h) => `"${h}"`).join(",") + "\n";
        await fs.promises.writeFile(filePath, headers, "utf8");
      } else {
        ensureFileHeaderMatchesSchema(filePath, canonicalHeaders);
      }

      await fs.promises.appendFile(filePath, formatCsvLine(cleanRecord) + "\n", "utf8");
      return true;
    })
    .catch((err) => {
      console.error(`Spreadsheet append error for ${canonicalSheetName}:`, err.message);
      return false;
    });

  writeQueues.set(canonicalSheetName, write);
  return write;
}

function getSpreadsheetPath(sheetName) {
  const schema = resolveSheetSchema(sheetName);
  if (!schema) return null;
  return path.join(LEDGER_DIR, `${schema.name}.csv`);
}

function writeSpreadsheetRecords(sheetName, records) {
  const schema = resolveSheetSchema(sheetName);
  if (!schema) return false;
  const filePath = path.join(LEDGER_DIR, `${schema.name}.csv`);

  if (!Array.isArray(records) || records.length === 0) return false;

  const headers = Object.keys(records[0]);
  const lines = [headers.map((h) => `"${h}"`).join(",")];
  records.forEach((record) => {
    const row = headers.map((key) => {
      const value = record[key] === null || record[key] === undefined ? "" : String(record[key]);
      return `"${value.replace(/"/g, '""')}"`;
    });
    lines.push(row.join(","));
  });

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf8");
  return true;
}

function updateSpreadsheetRecord(sheetName, predicate, updateRecord) {
  const schema = resolveSheetSchema(sheetName);
  if (!schema) return false;
  const filePath = path.join(LEDGER_DIR, `${schema.name}.csv`);
  if (!fs.existsSync(filePath)) return false;

  const rows = readSpreadsheet(schema.name);
  const idx = rows.findIndex((row) => predicate(row));
  if (idx < 0) return false;

  rows[idx] = { ...rows[idx], ...updateRecord };
  writeSpreadsheetRecords(schema.name, rows);
  return true;
}

// Helper to read all records from a spreadsheet CSV
// Populates BOTH human-readable headers and camelCase aliases for backward compatibility
function readSpreadsheet(sheetName) {
  const schema = resolveSheetSchema(sheetName);
  if (!schema) return [];

  try {
    const filePath = path.join(LEDGER_DIR, `${schema.name}.csv`);
    if (!fs.existsSync(filePath)) return [];

    ensureFileHeaderMatchesSchema(filePath, schema.columns.map((c) => c.header));

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((v) => v.replace(/^"|"$/g, ""));
      const item = {};
      headers.forEach((h, idx) => {
        const val = values[idx] || "";
        item[h] = val;
        const camel = headerToCamelCase(h);
        if (camel && item[camel] === undefined) {
          item[camel] = val;
        }
      });

      // Convenience aliases for common lookup fields
      if (item["Application ID"]) item.applicationId = item["Application ID"];
      if (item["Offer Reference ID"]) item.referenceId = item["Offer Reference ID"];
      if (item["Certificate ID"]) item.certificateId = item["Certificate ID"];
      if (item["Verification ID"]) item.verificationId = item["Verification ID"];
      if (item["Student Name"]) item.studentName = item["Student Name"];
      if (item["Student Email"]) item.studentEmail = item["Student Email"];
      if (item["Internship Domain"]) {
        item.domain = item["Internship Domain"];
        item.domainName = item["Internship Domain"];
      }

      records.push(item);
    }
    return records;
  } catch (err) {
    console.error(`Spreadsheet read error for ${schema.name}:`, err.message);
    return [];
  }
}

module.exports = {
  appendToSpreadsheet,
  readSpreadsheet,
  updateSpreadsheetRecord,
  getSpreadsheetPath,
  ALLOWED_SHEETS,
  writeSpreadsheetRecords,
  resolveSheetSchema,
  sanitizeAndFormatRecord,
  ensureFileHeaderMatchesSchema,
};
