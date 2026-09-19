# Google Apps Script Email & Sheet Relay Deployment Guide

This Google Apps Script Web App serves two functions for InternDock:
1. **Spreadsheet Sync**: Mirrors application, payment, submission, and certificate records to Google Sheets.
2. **Native Email Relay**: Relays transactional emails to students and `support.interndock@gmail.com` using Google's native mail servers (`MailApp` / `GmailApp`) directly over HTTPS (Port 443), completely bypassing any cloud host or ISP SMTP port restrictions (ports 25, 465, 587).

---

### Fast 2-Minute Deployment Steps

1. Open [Google Apps Script](https://script.google.com/) and select your existing InternDock script project (or create a new one).
2. Open the script file (`Code.gs`) and replace its contents completely with the code from [`Backend/google-apps-script/Code.gs`](file:///Users/amanmishra/Documents/Interndock/Backend/google-apps-script/Code.gs).
3. If your script uses a specific Google Sheet, ensure `SPREADSHEET_ID` is set to your Google Sheet ID. The `EXPECTED_TOKEN` is already prefilled to match your backend `.env`.
4. Click **Deploy** (top right) > **Manage deployments**.
5. Click the **Pencil (Edit)** icon next to your active Web App deployment.
6. Under **Version**, choose **New version**.
7. Ensure:
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone`
8. Click **Deploy**.
9. If permissions are requested, click **Authorize Access** and choose your Google account (`support.interndock@gmail.com`).

Once deployed, all transactional emails (student application confirmations, capstone submissions, and certificate notifications) will be dispatched instantly through your Google account.
