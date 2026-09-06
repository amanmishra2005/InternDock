const fs = require("fs");
const path = require("path");

const LEDGER_DIR = path.join(__dirname, "..", "uploads", "spreadsheet_ledger");
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
  try {
    const filePath = path.join(LEDGER_DIR, `${sheetName}.csv`);
    const fileExists = fs.existsSync(filePath);

    const timestamp = new Date().toISOString();
    const enrichedRecord = { timestamp, ...recordData };

    if (!fileExists) {
      // Write CSV headers on first creation
      const headers = Object.keys(enrichedRecord).map((h) => `"${h}"`).join(",") + "\n";
      fs.writeFileSync(filePath, headers, "utf8");
    }

    const row = formatCsvLine(enrichedRecord) + "\n";
    fs.appendFileSync(filePath, row, "utf8");

    // Optional webhook trigger for Google Sheets sync if URL is provided in env
    if (process.env.GOOGLE_SHEET_WEBHOOK_URL) {
      const fetch = require("node-fetch");
      fetch(process.env.GOOGLE_SHEET_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetName, ...enrichedRecord }),
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error(`Spreadsheet append error for ${sheetName}:`, err.message);
    return false;
  }
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

module.exports = { appendToSpreadsheet, readSpreadsheet };
