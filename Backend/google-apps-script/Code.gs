/**
 * InternDock Google Sheets Business Ledger Sync
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1aApAQ7BRt0iAevBRqjOMh4yDDCi0Gos07yvf1JlxjGI/edit
 */

const SPREADSHEET_ID = "1aApAQ7BRt0iAevBRqjOMh4yDDCi0Gos07yvf1JlxjGI";
const EXPECTED_TOKEN = "q-RsOPndQUmYSNL83xfLHD6Zze5WgrdxKCjOjF2x5lo";

// Tab branding colors (Hex)
const TAB_COLORS = {
  applications: "#2563EB",   // Royal Blue
  payments: "#059669",       // Emerald Green
  offer_letters: "#7C3AED",  // Royal Violet
  submissions: "#D97706",    // Warm Amber
  final_projects: "#EA580C", // Vibrant Orange
  certificates: "#0891B2",   // Ocean Cyan
  contact_queries: "#DB2777",// Rose Pink
};

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

/**
 * MASTER SETUP FUNCTION (Default function)
 * Run this function in Apps Script to instantly create and format all 7 tabs!
 */
function setupAllSheets() {
  const ss = getTargetSpreadsheet();
  Logger.log("Connected to Spreadsheet: " + ss.getName() + " (ID: " + ss.getId() + ")");

  const sheetKeys = Object.keys(ORDERED_COLUMNS);
  for (let i = 0; i < sheetKeys.length; i++) {
    const sheetName = sheetKeys[i];
    Logger.log("Creating tab [" + (i + 1) + "/7]: " + sheetName);
    setupSheet(ss, sheetName, ORDERED_COLUMNS[sheetName]);
  }

  // Remove default empty "Sheet1" if tabs exist
  try {
    const sheets = ss.getSheets();
    for (let j = 0; j < sheets.length; j++) {
      const s = sheets[j];
      const name = s.getName();
      if ((name === "Sheet1" || name === "Sheet 1") && s.getLastRow() === 0 && ss.getSheets().length > 1) {
        ss.deleteSheet(s);
        Logger.log("Deleted default empty Sheet1");
        break;
      }
    }
  } catch (e) {
    Logger.log("Default sheet check: " + e.message);
  }

  Logger.log("🎉 SUCCESS: All 7 InternDock ledger tabs created and styled!");
  return "All 7 InternDock ledger sheets have been successfully initialized and styled!";
}

/**
 * Returns the target Google Spreadsheet instance.
 */
function getTargetSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim().length > 0) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (err) {
      Logger.log("Could not open by ID (" + SPREADSHEET_ID + "): " + err.message);
    }
  }

  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  throw new Error("Could not connect to spreadsheet. Check SPREADSHEET_ID: " + SPREADSHEET_ID);
}

/**
 * Column alignment rules
 */
function getHeaderAlignment(header) {
  const centerHeaders = [
    "Timestamp",
    "Application ID",
    "Offer Reference ID",
    "Certificate ID",
    "Verification ID",
    "UTR / Transaction ID",
    "Order ID",
    "Task Number",
    "Graduation Year",
    "Start Date",
    "End Date",
    "Issue Date",
    "Payment Status",
    "Application Status",
    "Submission Status",
    "Project Status",
    "Status",
    "Track Duration",
  ];
  const rightHeaders = [
    "Program Fee (INR)",
    "Amount (INR)",
  ];

  if (centerHeaders.includes(header)) return "center";
  if (rightHeaders.includes(header)) return "right";
  return "left";
}

/**
 * Styles the header row with the Slate Navy theme
 */
function styleHeaderRow(sheet, headers) {
  try {
    sheet.setRowHeight(1, 38);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Arial");
    headerRange.setFontSize(10);
    headerRange.setBackground("#0F172A"); // Rich Slate Navy
    headerRange.setFontColor("#FFFFFF");  // White text
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    try {
      headerRange.setBorder(true, true, true, true, true, true, "#334155", SpreadsheetApp.BorderStyle.SOLID);
    } catch (bErr) {
      headerRange.setBorder(true, true, true, true, true, true);
    }
    sheet.setFrozenRows(1);
    sheet.setHideGridlines(false);
  } catch (err) {
    Logger.log("styleHeaderRow: " + err.message);
  }
}

/**
 * Formats data rows with zebra striping and alignment
 */
function styleDataRow(sheet, rowNum, activeHeaders) {
  const numCols = activeHeaders.length;
  if (numCols === 0) return;

  try {
    sheet.setRowHeight(rowNum, 26);
    const rowRange = sheet.getRange(rowNum, 1, 1, numCols);
    rowRange.setVerticalAlignment("middle");
    rowRange.setFontFamily("Arial");
    rowRange.setFontSize(9.5);

    const bgColor = (rowNum % 2 === 0) ? "#F8FAFC" : "#FFFFFF";
    rowRange.setBackground(bgColor);

    try {
      rowRange.setBorder(true, true, true, true, true, true, "#E2E8F0", SpreadsheetApp.BorderStyle.SOLID);
    } catch (bErr) {
      rowRange.setBorder(true, true, true, true, true, true);
    }

    for (let c = 1; c <= numCols; c++) {
      const header = activeHeaders[c - 1];
      const align = getHeaderAlignment(header);
      const cell = sheet.getRange(rowNum, c);
      cell.setHorizontalAlignment(align);

      if (header.includes("(INR)") || header.includes("Amount") || header.includes("Fee")) {
        cell.setNumberFormat("₹#,##0");
      }

      if (header === "Message" || header === "Executive Summary" || header === "Notes / Comments") {
        cell.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      } else if (header.includes("URL")) {
        cell.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
      }
    }
  } catch (err) {
    Logger.log("styleDataRow: " + err.message);
  }
}

/**
 * Creates or updates an individual sheet tab
 */
function setupSheet(spreadsheet, sheetName, expectedHeaders) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  try {
    if (TAB_COLORS[sheetName]) {
      sheet.setTabColor(TAB_COLORS[sheetName]);
    }
  } catch (e) {}

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
  } else {
    const currentHeaders = sheet
      .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
      .getValues()[0];
    const missing = expectedHeaders.filter((h) => !currentHeaders.includes(h));
    if (missing.length > 0) {
      const startCol = currentHeaders.length + 1;
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    }
  }

  const activeHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  styleHeaderRow(sheet, activeHeaders);

  const lastRow = sheet.getLastRow();
  for (let r = 2; r <= lastRow; r++) {
    styleDataRow(sheet, r, activeHeaders);
  }

  for (let c = 1; c <= activeHeaders.length; c++) {
    try {
      sheet.autoResizeColumn(c);
      const colWidth = sheet.getColumnWidth(c);
      if (colWidth < 120) {
        sheet.setColumnWidth(c, 120);
      }
    } catch (e) {}
  }

  return sheet;
}

function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("InternDock ⚡")
      .addItem("✨ Initialize / Format All 7 Sheets", "setupAllSheets")
      .addToUi();
  } catch (e) {}
}

function keyVariantsForHeader(header) {
  const raw = String(header || "").trim();
  if (!raw) return [];

  const cleaned = raw
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  const camel = words
    .map((word, index) => {
      const value = word.replace(/[^a-zA-Z0-9]/g, "");
      if (!value) return "";
      return index === 0
        ? value.charAt(0).toLowerCase() + value.slice(1)
        : value.charAt(0).toUpperCase() + value.slice(1);
    })
    .join("");

  const compact = raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const titleCase = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return Array.from(
    new Set([
      raw,
      raw.toLowerCase(),
      raw.replace(/\s+/g, ""),
      raw.replace(/\s+/g, "").toLowerCase(),
      raw.replace(/\s+/g, " ").trim(),
      camel,
      compact,
      titleCase,
      titleCase.replace(/\s+/g, ""),
    ])
  );
}

function getPayloadValueForHeader(payload, header) {
  const candidates = keyVariantsForHeader(header);
  const aliasMap = {
    "Application ID": ["applicationId", "appId", "id"],
    "Student Name": ["studentName", "name"],
    "Student Email": ["studentEmail", "email"],
    "Phone Number": ["phoneNumber", "phone", "mobileNumber"],
    "College / University": ["collegeName", "college", "university"],
    "Degree / Branch": ["degreeBranch", "degree", "branch"],
    "Graduation Year": ["graduationYear", "yearOfGraduation"],
    "Internship Domain": ["domainName", "domain", "internshipDomain"],
    "Track Duration": ["durationLabel", "trackDuration", "duration"],
    "Start Date": ["startDate", "start"],
    "End Date": ["endDate", "end"],
    "Program Fee (INR)": ["programFeeInr", "programFee", "fee", "amount"],
    "Payment Status": ["paymentStatus", "status"],
    "Application Status": ["applicationStatus", "status"],
    Timestamp: ["timestamp", "createdAt"],
    "Offer Reference ID": ["referenceId", "offerReferenceId", "offerId"],
    "UTR / Transaction ID": ["utrNumber", "transactionId", "utr", "paymentId"],
    "Payer Name": ["payerName", "studentName"],
    "Order ID": ["orderId"],
    "Certificate ID": ["certificateId", "id"],
    "Verification ID": ["verificationId", "verifyId"],
    "Issue Date": ["issueDate", "date"],
    "Task Number": ["taskNumber", "assignmentNumber"],
    "Task Title": ["taskTitle", "assignmentTitle", "title"],
    "GitHub URL": ["githubUrl", "github"],
    "Live Demo URL": ["liveDemoUrl", "liveUrl", "demoUrl"],
    "Submission Status": ["submissionStatus", "status"],
    "Notes / Comments": ["notes", "comments", "textContent"],
    "Project Title": ["projectTitle", "title"],
    "GitHub Repository URL": [
      "githubRepositoryUrl",
      "githubUrl",
      "repositoryUrl",
    ],
    "Hosted Live Demo URL": [
      "hostedLiveDemoUrl",
      "liveDemoUrl",
      "liveUrl",
      "demoUrl",
    ],
    "Executive Summary": ["executiveSummary", "summary", "textContent"],
    "Project Status": ["projectStatus", "status"],
    Name: ["name"],
    Email: ["email"],
    Subject: ["subject"],
    Message: ["message"],
    Status: ["status"],
  };

  const aliasCandidates = aliasMap[header] || [];
  for (const key of [...candidates, ...aliasCandidates]) {
    if (payload[key] !== undefined && payload[key] !== null) return payload[key];
  }

  return "-";
}

function doGet(e) {
  return ContentService.createTextOutput(
    "InternDock Google Sheets Business Ledger Sync is active."
  ).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const incomingToken = payload.webhookToken || "";

    if (!incomingToken || incomingToken !== EXPECTED_TOKEN) {
      return ContentService.createTextOutput("Unauthorized").setMimeType(
        ContentService.MimeType.TEXT
      );
    }

    if (payload.action === "send_email" || payload.action === "sendEmail") {
      const recipient = String(payload.to || "").trim();
      const subject = String(
        payload.subject || "InternDock Notification"
      ).trim();
      const htmlBody = payload.html || payload.htmlBody || "";
      const replyTo = payload.replyTo || "support.interndock@gmail.com";
      const senderName = payload.senderName || "InternDock";

      if (!recipient) {
        return ContentService.createTextOutput(
          "Error: Missing recipient"
        ).setMimeType(ContentService.MimeType.TEXT);
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
        JSON.stringify({
          success: true,
          message: "Email sent to " + recipient,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.__diagnostic_check) {
      const spreadsheet = getTargetSpreadsheet();
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Connected successfully to spreadsheet: " + spreadsheet.getName(),
          sheetId: spreadsheet.getId(),
          sheets: spreadsheet.getSheets().map((s) => s.getName()),
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.sheetName === "emails") {
      return ContentService.createTextOutput(
        "OK: Email logs omitted from ledger"
      ).setMimeType(ContentService.MimeType.TEXT);
    }

    const rawSheetName = String(payload.sheetName || "")
      .trim()
      .toLowerCase();
    const canonicalName = SHEET_ALIASES[rawSheetName];

    if (!canonicalName || !ORDERED_COLUMNS[canonicalName]) {
      return ContentService.createTextOutput(
        "Ignored: Not an authorized business sheet"
      ).setMimeType(ContentService.MimeType.TEXT);
    }

    const spreadsheet = getTargetSpreadsheet();
    const expectedHeaders = ORDERED_COLUMNS[canonicalName];

    let sheet = spreadsheet.getSheetByName(canonicalName);
    if (!sheet || sheet.getLastRow() === 0) {
      sheet = setupSheet(spreadsheet, canonicalName, expectedHeaders);
    }

    const activeHeaders = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    const row = activeHeaders.map((header) =>
      getPayloadValueForHeader(payload, header)
    );

    sheet.appendRow(row);
    const newRowNum = sheet.getLastRow();

    styleDataRow(sheet, newRowNum, activeHeaders);

    if (newRowNum <= 50 || newRowNum % 25 === 0) {
      for (let i = 1; i <= activeHeaders.length; i++) {
        sheet.autoResizeColumn(i);
        if (sheet.getColumnWidth(i) < 120) {
          sheet.setColumnWidth(i, 120);
        }
      }
    }

    return ContentService.createTextOutput("OK").setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (err) {
    Logger.log("doPost error: " + err.message);
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}
