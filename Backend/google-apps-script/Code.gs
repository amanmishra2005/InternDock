const SPREADSHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const EXPECTED_TOKEN = "PASTE_YOUR_GOOGLE_SHEET_WEBHOOK_TOKEN_HERE";

function doGet(e) {
  return ContentService.createTextOutput(
    "InternDock Google Sheet sync endpoint is ready. Use POST with the webhook token.",
  ).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const incomingToken = payload.webhookToken || "";

    if (!incomingToken || incomingToken !== EXPECTED_TOKEN) {
      return ContentService.createTextOutput("Unauthorized").setMimeType(
        ContentService.MimeType.TEXT,
      );
    }

    const sheetName = String(payload.sheetName || "applications").trim();
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    const orderedKeys = Object.keys(payload)
      .filter((key) => key !== "webhookToken" && key !== "sheetName")
      .sort((a, b) => a.localeCompare(b));

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(orderedKeys);
    } else {
      const header = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      const missing = orderedKeys.filter((key) => !header.includes(key));
      if (missing.length > 0) {
        const startColumn = header.length + 1;
        sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
      }
    }

    const header = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const row = header.map((key) => payload[key] ?? "");
    sheet.appendRow(row);

    return ContentService.createTextOutput("OK").setMimeType(
      ContentService.MimeType.TEXT,
    );
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(
      ContentService.MimeType.TEXT,
    );
  }
}
