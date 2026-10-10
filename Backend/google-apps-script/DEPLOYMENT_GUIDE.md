# Google Sheets Business Ledger & Webhook Setup Guide

This guide walks you through connecting a **brand new Google Sheet** to InternDock. All data is synchronized into **7 clean, human-readable tabs** with an executive Slate & Navy theme, tab color coding, zebra striping, and proper column alignment.

---

### The 7 Business Ledger Tabs:
| Tab Name | Purpose & Key Fields | Tab Accent Color |
| :--- | :--- | :--- |
| **`applications`** | Application ID, Student Name, Email, Phone, College, Degree, Domain, Track, Fee, Status | 🔵 Royal Blue (`#2563EB`) |
| **`payments`** | Application ID, Student Name, Domain, Amount, UTR / Transaction ID, Order ID | 🟢 Emerald Green (`#059669`) |
| **`offer_letters`** | Offer Reference ID, Student, College, Track, Dates, Issue Date, Verification ID | 🟣 Royal Violet (`#7C3AED`) |
| **`submissions`** | Task Number, Task Title, GitHub URL, Live Demo URL, Status, Notes | 🟡 Warm Amber (`#D97706`) |
| **`final_projects`** | Project Title, GitHub Repo URL, Live Demo URL, Executive Summary, Status | 🟠 Vibrant Orange (`#EA580C`) |
| **`certificates`** | Certificate ID, Student, College, Domain, Track, Dates, Verification ID | 🌐 Ocean Cyan (`#0891B2`) |
| **`contact_queries`**| Name, Email, Subject, Message, Status | 🌸 Rose Pink (`#DB2777`) |

> [!NOTE]
> **No Mail or Delivery Logs**: Transactional email tracking logs, sent/received messages, and internal database ObjectIds are intentionally excluded from the spreadsheets to keep your ledgers clean, uncluttered, and readable.

---

## Step-by-Step Setup Guide (Takes ~2 Minutes)

### Step 1: Create Your New Google Spreadsheet
1. Go to [sheets.google.com](https://sheets.google.com/) and click **Blank spreadsheet**.
2. Rename the spreadsheet at the top left to:
   ```text
   InternDock - Business Ledger
   ```

---

### Step 2: Open the Apps Script Editor
1. In the Google Sheets menu at the top, click:
   **Extensions** > **Apps Script**.
2. A new tab will open with the Google Apps Script code editor.
3. Name your Apps Script project at the top left:
   ```text
   InternDock Ledger Sync
   ```

---

### Step 3: Paste the Script Code
1. In the Apps Script editor, open `Code.gs`.
2. Delete everything inside `Code.gs`.
3. Open [`Backend/google-apps-script/Code.gs`](file:///Users/amanmishra/Documents/Interndock/Backend/google-apps-script/Code.gs) in this repository and copy all the code.
4. Paste it into `Code.gs` in your Google Apps Script editor.
5. Click the **💾 Save** button (or press `Cmd + S` / `Ctrl + S`).

> [!TIP]
> Because you opened Apps Script from **Extensions > Apps Script** inside your spreadsheet, the script is directly linked to your sheet. You don't even need to change `SPREADSHEET_ID`! If you ever use a standalone script, just paste your Sheet ID from the URL (`/d/SPREADSHEET_ID/edit`).

---

### Step 4: Initialize All 7 Tabs (One-Click)
1. In the Apps Script toolbar, locate the function dropdown (next to "Debug").
2. Select **`setupAllSheets`**.
3. Click the **▶ Run** button.
4. A popup titled **"Authorization Required"** will appear on the first run:
   - Click **Review permissions**.
   - Select your Google account (`support.interndock@gmail.com`).
   - Click **Advanced** > **Go to InternDock Ledger Sync (unsafe)**.
   - Click **Allow**.
5. Switch back to your Google Spreadsheet tab in your browser.
   **You will see all 7 tabs created instantly with custom tab colors, frozen dark navy headers, and formatted columns!**

---

### Step 5: Deploy the Web App
1. At the top right of the Apps Script window, click the blue **Deploy** button > **New deployment**.
2. Click the **Gear icon (⚙ Select type)** on the left and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `InternDock Production Webhook`
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone` *(Crucial: must be "Anyone" so your backend webhook can connect)*
4. Click **Deploy**.
5. Copy the **Web App URL** shown (it starts with `https://script.google.com/macros/s/.../exec`).

> [!WARNING]
> Whenever you edit `Code.gs` in the future, you must click **Deploy** > **Manage deployments** > **Edit (pencil icon)** > **Version: New version** > **Deploy**. Google Apps Script does not update live webhooks until a new version is deployed.

---

### Step 6: Update Backend `.env`
1. Open your [`Backend/.env`](file:///Users/amanmishra/Documents/Interndock/Backend/.env) file.
2. Update the `GOOGLE_SHEET_WEBHOOK_URL` with your new Web App URL:
   ```env
   GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec
   GOOGLE_SHEET_WEBHOOK_TOKEN=q-RsOPndQUmYSNL83xfLHD6Zze5WgrdxKCjOjF2x5lo
   GOOGLE_SHEET_SYNC_TIMEOUT_MS=10000
   ```
3. Save the `.env` file.

---

### Step 7: Test the Connection and Sync Existing Records
Run the diagnostic check from your terminal:
```bash
npm run sync:sheets
```
If configured correctly, you will see:
```text
✅ Webhook connection successful! Google Apps Script responded: {"success":true,"message":"Connected successfully to spreadsheet: InternDock - Business Ledger",...}
```

To sync all existing backlog records from your local storage to your new spreadsheet:
```bash
npm run sync:sheets -- --push
```

---

### Bonus: Custom Menu in Google Sheets
Every time you open your Google Spreadsheet, an **InternDock ⚡** menu will appear in the top menu bar with:
- **✨ Initialize / Format All 7 Sheets**: Re-applies all headers, alignments, and styling.
- **🎨 Re-style Current Sheet**: Formats and styles the active tab.
