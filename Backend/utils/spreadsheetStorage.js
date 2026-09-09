const fs = require("fs");
const path = require("path");

const LEDGER_DIR = process.env.LEDGER_DIR || path.join(__dirname, "..", "uploads", "spreadsheet_ledger");
const writeQueues = new Map();
const ALLOWED_SHEETS = new Set([
  "applications",
  "certificates",
  "final_reports",
  "offer_letters",
  "submissions",
  "payments",
  "contact_queries",
]);
if (!fs.existsSync(LEDGER_DIR)) {
  fs.mkdirSync(LEDGER_DIR, { recursive: true });
}

// Convert object payload to a clean CSV line
function formatCsvLine(dataObject) {
  return Object.values(dataObject)
    .map((val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    })
    .join(",");
}

// Append a record to a spreadsheet CSV file safely
function appendToSpreadsheet(sheetName, recordData) {
  if (!ALLOWED_SHEETS.has(sheetName)) return false;

  const previous = writeQueues.get(sheetName) || Promise.resolve();
  const write = previous
    .catch(() => {})
    .then(async () => {
      await fs.promises.mkdir(LEDGER_DIR, { recursive: true });
      const filePath = path.join(LEDGER_DIR, `${sheetName}.csv`);
      const timestamp = new Date().toISOString();
      const enrichedRecord = { timestamp, ...recordData };
      const fileExists = fs.existsSync(filePath);

      if (!fileExists) {
        const headers = Object.keys(enrichedRecord).map((h) => `"${h}"`).join(",") + "\n";
        await fs.promises.writeFile(filePath, headers, "utf8");
      }

      await fs.promises.appendFile(filePath, formatCsvLine(enrichedRecord) + "\n", "utf8");

      if (process.env.GOOGLE_SHEET_WEBHOOK_URL && typeof fetch === "function") {
        const timeoutMs = Number(process.env.GOOGLE_SHEET_SYNC_TIMEOUT_MS) || 10000;
        await fetch(process.env.GOOGLE_SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheetName,
            ...enrichedRecord,
            webhookToken: process.env.GOOGLE_SHEET_WEBHOOK_TOKEN || undefined,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        }).catch((err) => console.error("Google Sheets sync error:", err.message));
      }
    })
    .catch((err) => console.error(`Spreadsheet append error for ${sheetName}:`, err.message));

  writeQueues.set(sheetName, write);
  return true;
}

function getSpreadsheetPath(sheetName) {
  if (!ALLOWED_SHEETS.has(sheetName)) return null;
  return path.join(LEDGER_DIR, `${sheetName}.csv`);
}

function writeSpreadsheetRecords(sheetName, records) {
  if (!ALLOWED_SHEETS.has(sheetName)) return false;
  const filePath = path.join(LEDGER_DIR, `${sheetName}.csv`);

  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  if (headers.length === 0) return false;

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
  if (!ALLOWED_SHEETS.has(sheetName)) return false;
  const filePath = path.join(LEDGER_DIR, `${sheetName}.csv`);
  if (!fs.existsSync(filePath)) return false;

  const rows = readSpreadsheet(sheetName);
  const idx = rows.findIndex((row) => predicate(row));
  if (idx < 0) return false;

  rows[idx] = { ...rows[idx], ...updateRecord };
  writeSpreadsheetRecords(sheetName, rows);
  return true;
}

// Helper to read all records from a spreadsheet CSV
function readSpreadsheet(sheetName) {
  try {
    const filePath = path.join(LEDGER_DIR, `${sheetName}.csv`);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV parser
      const values = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((v) => v.replace(/^"|"$/g, ""));
      const item = {};
      headers.forEach((h, idx) => {
        item[h] = values[idx] || "";
      });
      records.push(item);
    }
    return records;
  } catch (err) {
    console.error(`Spreadsheet read error for ${sheetName}:`, err.message);
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
};
