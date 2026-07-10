# Mail2Ledger

Mail2Ledger is a Google Apps Script project designed to automatically parse financial transaction emails (like those from HDFC, SBI, AXIS, ICICI, YES Bank) in Gmail and log them into a Google Sheet ledger.

## Local Setup

To set up this project locally, ensure you have Node.js installed, then follow these steps:

1. Clone or download this project.
2. Open your terminal in the `mail2ledger` directory.
3. Install the dependencies (this installs `clasp` as a devDependency):
   ```bash
   npm install
   ```
4. Log in to your Google Account using clasp:
   ```bash
   npm run login
   ```
5. Create a new Google Apps Script project or bind to an existing one:
   ```bash
   # To create a new script:
   npm run create
   ```
   *(Note: This creates a `.clasp.json` file in the folder. If you already have a script, you can configure `.clasp.json` manually with your scriptId).*

## How to Push to Apps Script

To push your local code changes to Google Apps Script:

```bash
npm run push
```

To pull the latest changes from Google Apps Script:

```bash
npm run pull
```

To open the script in your web browser:

```bash
npm run open
```
