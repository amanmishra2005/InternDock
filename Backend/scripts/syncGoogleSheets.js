#!/usr/bin/env node
/**
 * InternDock Google Sheets Diagnostics & Backlog Sync Utility
 *
 * Usage:
 *   node scripts/syncGoogleSheets.js          # Tests connection & diagnoses errors
 *   node scripts/syncGoogleSheets.js --push   # Tests connection and pushes all local CSV rows to Google Sheets
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { readSpreadsheet, ALLOWED_SHEETS } = require("../utils/spreadsheetStorage");

const WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
const WEBHOOK_TOKEN = process.env.GOOGLE_SHEET_WEBHOOK_TOKEN || "";
const LEDGER_DIR =
  process.env.LEDGER_DIR ||
  path.join(__dirname, "..", "uploads", "spreadsheet_ledger");

async function testConnection() {
  console.log("\n--- Checking Google Sheets Webhook Configuration ---");
  console.log(`URL:   ${WEBHOOK_URL || "(NOT SET)"}`);
  console.log(`Token: ${WEBHOOK_TOKEN ? WEBHOOK_TOKEN.slice(0, 8) + "..." : "(NOT SET)"}`);

  if (!WEBHOOK_URL) {
    console.error("\n❌ GOOGLE_SHEET_WEBHOOK_URL is not set in Backend/.env.");
    return false;
  }

  console.log("\nTesting webhook response...");

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookToken: WEBHOOK_TOKEN,
        sheetName: "applications",
        __diagnostic_check: true,
      }),
    });

    const body = (await res.text()).trim();

    if (body.includes("Unauthorized")) {
      console.error("\n❌ Connection Failed: Webhook returned 'Unauthorized'.");
      console.error("Reason: The token sent does not match EXPECTED_TOKEN in your Google Apps Script,");
      console.error("        OR you edited Code.gs in Google Apps Script but haven't deployed a 'New version'.");
      console.error("\nFix Steps:");
      console.error("1. Open your script project at https://script.google.com/");
      console.error("2. Verify that EXPECTED_TOKEN matches GOOGLE_SHEET_WEBHOOK_TOKEN in Backend/.env.");
      console.error("3. Verify that SPREADSHEET_ID is set to your actual Google Sheet ID.");
      console.error("4. Click Deploy > Manage deployments > Edit (pencil icon).");
      console.error("5. Under Version, select 'New version' and click Deploy.");
      return false;
    }

    if (body.includes("Error:") || body.includes("<html") || body.includes("<!DOCTYPE")) {
      console.error("\n❌ Connection Failed: Google Apps Script returned an error.");
      console.error("Output:", body.slice(0, 300));
      return false;
    }

    console.log("✅ Webhook connection successful! Google Apps Script responded:", body);
    return true;
  } catch (err) {
    console.error("\n❌ Network error while reaching webhook:", err.message);
    return false;
  }
}

async function pushBacklog() {
  const ok = await testConnection();
  if (!ok) {
    console.error("\nAborting push: Webhook connection is not working yet.");
    process.exit(1);
  }

  console.log("\n--- Synchronizing Local CSV Backlog to Google Sheets ---");
  const sheetsToSync = Array.from(ALLOWED_SHEETS);
  let totalPushed = 0;

  for (const sheetName of sheetsToSync) {
    const records = readSpreadsheet(sheetName);
    if (!records || records.length === 0) continue;

    console.log(`Syncing ${records.length} records for tab: ${sheetName}...`);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheetName,
            ...record,
            webhookToken: WEBHOOK_TOKEN,
          }),
        });
        const text = await res.text();
        if (text.includes("OK")) {
          totalPushed++;
        }
      } catch (err) {
        console.warn(`Failed to push record ${i + 1} of ${sheetName}:`, err.message);
      }
      // Small pause to respect Google Apps Script rate limits
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\n🎉 Successfully synchronized ${totalPushed} records to Google Sheets!`);
}

const shouldPush = process.argv.includes("--push");
if (shouldPush) {
  pushBacklog();
} else {
  testConnection();
}
