/**
 * InternDock Google Sheets Business Ledger Sync
 * 
 * Synchronizes only essential, future-useful business data into Google Sheets.
 * Strictly organized into 7 clean, human-readable tabs:
 * 1. applications
 * 2. payments
 * 3. offer_letters
 * 4. submissions
 * 5. final_projects
 * 6. certificates
 * 7. contact_queries
 * 
 * NOTE: Transactional email logs, sent/received mail, and raw database IDs are NEVER stored.
 */

const SPREADSHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const EXPECTED_TOKEN = "q-RsOPndQUmYSNL83xfLHD6Zze5WgrdxKCjOjF2x5lo";

// Canonical ordered columns for each sheet to keep sheets clean, readable, and structured
const ORDERED_COLUMNS = {
  applications: [
    "Timestamp",
    "Application ID",
    "Student Name",
    "Student Email",
    "Phone Number",
    "College / University",
    "Degree / Branch",
    "Graduation Year",
    "Internship Domain",
    "Track Duration",
    "Start Date",
    "End Date",
    "Program Fee (INR)",
    "Payment Status",
    "Application Status",
  ],
  payments: [
    "Timestamp",
    "Application ID",
    "Student Name",
    "Student Email",
    "Internship Domain",
    "Amount (INR)",
    "Payment Status",
    "UTR / Transaction ID",
    "Payer Name",
    "Order ID",
  ],
  offer_letters: [
    "Timestamp",
    "Offer Reference ID",
    "Application ID",
    "Student Name",
    "Student Email",
    "College / University",
    "Internship Domain",
    "Track Duration",
    "Start Date",
    "End Date",
    "Issue Date",
    "Verification ID",
  ],
  submissions: [
    "Timestamp",
    "Application ID",
    "Student Name",
    "Student Email",
    "Internship Domain",
    "Task Number",
    "Task Title",
    "GitHub URL",
    "Live Demo URL",
    "Submission Status",
    "Notes / Comments",
  ],
  final_projects: [
    "Timestamp",
    "Application ID",
    "Student Name",
    "Student Email",
    "College / University",
    "Internship Domain",
    "Project Title",
    "GitHub Repository URL",
    "Hosted Live Demo URL",
    "Executive Summary",
    "Project Status",
  ],
  certificates: [
    "Timestamp",
    "Certificate ID",
    "Application ID",
    "Student Name",
    "Student Email",
    "College / University",
    "Internship Domain",
    "Track Duration",
    "Start Date",
    "End Date",
    "Issue Date",
    "Verification ID",
  ],
  contact_queries: [
    "Timestamp",
    "Name",
    "Email",
    "Subject",
    "Message",
    "Status",
  ],
};

// Aliases mapping user requests and variations to canonical sheet names
const SHEET_ALIASES = {
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

function doGet(e) {
  return ContentService.createTextOutput(
    "InternDock Google Sheets Business Ledger Sync is active.",
  ).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const incomingToken = payload.webhookToken || "";

    // 1. Authenticate webhook request
    if (!incomingToken || incomingToken !== EXPECTED_TOKEN) {
      return ContentService.createTextOutput("Unauthorized").setMimeType(
        ContentService.MimeType.TEXT,
      );
    }

    // 2. Transactional Email Relay (Dispatches emails without touching or storing anything in Google Sheets)
    if (payload.action === "send_email" || payload.action === "sendEmail") {
      const recipient = String(payload.to || "").trim();
      const subject = String(payload.subject || "InternDock Notification").trim();
      const htmlBody = payload.html || payload.htmlBody || "";
      const replyTo = payload.replyTo || "support.interndock@gmail.com";
      const senderName = payload.senderName || "InternDock";

      if (!recipient) {
        return ContentService.createTextOutput("Error: Missing recipient").setMimeType(
          ContentService.MimeType.TEXT,
        );
      }

      try {
        MailApp.sendEmail({
          to: recipient,
          subject: subject,
          htmlBody: htmlBody,
          replyTo: replyTo,
          name: senderName,
        });
      } catch (mailErr) {
        GmailApp.sendEmail(recipient, subject, "", {
          htmlBody: htmlBody,
          replyTo: replyTo,
          name: senderName,
        });
      }

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: "Email sent to " + recipient }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Ignore any email log entries (email logs are never stored in the spreadsheet)
    if (payload.sheetName === "emails") {
      return ContentService.createTextOutput("OK: Email logs omitted from ledger").setMimeType(
        ContentService.MimeType.TEXT,
      );
    }


    // 3. Resolve canonical sheet name
    const rawSheetName = String(payload.sheetName || "").trim().toLowerCase();
    const canonicalName = SHEET_ALIASES[rawSheetName];

    if (!canonicalName || !ORDERED_COLUMNS[canonicalName]) {
      return ContentService.createTextOutput("Ignored: Not an authorized business sheet").setMimeType(
        ContentService.MimeType.TEXT,
      );
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(canonicalName);

    // Create and format new sheet if it does not yet exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(canonicalName);
    }

    const expectedHeaders = ORDERED_COLUMNS[canonicalName];

    // If sheet is empty, write header row with formatting
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(expectedHeaders);
      const headerRange = sheet.getRange(1, 1, 1, expectedHeaders.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    } else {
      // Ensure missing headers are added
      const currentHeaders = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      const missing = expectedHeaders.filter((h) => !currentHeaders.includes(h));
      if (missing.length > 0) {
        const startColumn = currentHeaders.length + 1;
        const missingRange = sheet.getRange(1, startColumn, 1, missing.length);
        missingRange.setValues([missing]);
        missingRange.setFontWeight("bold");
        missingRange.setBackground("#0f172a");
        missingRange.setFontColor("#ffffff");
      }
    }

    // Map payload into the exact column order of the sheet
    const activeHeaders = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    const row = activeHeaders.map((header) => {
      // Find matching key in payload (by header text or camelCase variation)
      if (payload[header] !== undefined) return payload[header];
      return "-";
    });

    sheet.appendRow(row);

    // Auto-fit columns periodically or for fresh sheets
    if (sheet.getLastRow() <= 20) {
      for (let i = 1; i <= activeHeaders.length; i++) {
        sheet.autoResizeColumn(i);
      }
    }

    return ContentService.createTextOutput("OK").setMimeType(
      ContentService.MimeType.TEXT,
    );
  } catch (err) {
    console.error("Spreadsheet sync error:", err);
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(
      ContentService.MimeType.TEXT,
    );
  }
}
