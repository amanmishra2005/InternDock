# Google Apps Script Business Ledger Sync Deployment Guide

This Google Apps Script Web App synchronizes **only essential, future-useful business data** from InternDock into your Google Spreadsheet.

### 7 Clean, Human-Readable Business Sheets:
1. **`applications`**: Applications with student name, contact, college, degree, track, dates, and status.
2. **`payments`**: Program fee payments with student identity, amount, UTR / Transaction ID, and payer name.
3. **`offer_letters`**: Issued offer letters with reference ID, dates, and verification codes.
4. **`submissions`**: Weekly milestone task submissions with task numbers, titles, GitHub links, and live URLs.
5. **`final_projects`**: Capstone final project submissions with repository URLs, hosted demos, and executive summaries.
6. **`certificates`**: Official completion certificates with certificate IDs, student details, and verification IDs.
7. **`contact_queries`**: Inquiries submitted through the contact form.

> [!NOTE]
> **No Mail or Delivery Logs**: Transactional email tracking logs, sent/received messages, and internal database ObjectIds are intentionally excluded from the spreadsheets to keep your ledgers clean, uncluttered, and readable.

---

### Fast 2-Minute Deployment Steps

1. Open [Google Apps Script](https://script.google.com/) and select your existing InternDock script project.
2. Open `Code.gs` and replace its contents completely with the updated code from [`Backend/google-apps-script/Code.gs`](file:///Users/amanmishra/Documents/Interndock/Backend/google-apps-script/Code.gs).
3. Set `SPREADSHEET_ID` to your Google Sheet ID (found in the URL between `/d/` and `/edit`). The `EXPECTED_TOKEN` is already prefilled to match your backend `.env`.
4. Click **Deploy** (top right) > **Manage deployments**.
5. Click the **Pencil (Edit)** icon next to your active Web App deployment.
6. Under **Version**, choose **New version**.
7. Ensure:
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone`
8. Click **Deploy**.
9. If permissions are requested, click **Authorize Access** and select your Google account (`support.interndock@gmail.com`).

Once deployed, records will automatically organize into cleanly formatted, auto-sized tabs with styled header rows.
