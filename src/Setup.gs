/**
 * @file Setup.gs
 * @description Setup and installation logic for the Mail2Ledger application, including creating necessary triggers and initial sheet structures.
 */

/**
 * Automatically creates all required sheets with their headers if they don't exist.
 * Leaves existing sheets untouched, but populates headers if the first row is empty.
 *
 * @return {string} Success message indicating initialization is completed.
 */
function initializeSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetsConfig = [
    {
      name: "Settings",
      headers: ["Key", "Value"]
    },
    {
      name: "Accounts",
      headers: ["Account ID", "Account Name", "Bank", "Type", "Identifier", "Active"]
    },
    {
      name: "EmailSenders",
      headers: ["Bank", "Sender Email", "Parser", "Active"]
    },
    {
      name: "ProcessedEmails",
      headers: ["Message ID", "Processed At"]
    },
    {
      name: "Transactions",
      headers: ["Date", "Time", "Bank", "Account", "Type", "Reference", "Particulars", "Bill Number", "Withdrawal", "Deposit", "Balance", "Sender", "Subject", "Message ID"]
    }
  ];

  sheetsConfig.forEach(function(config) {
    var sheet = getOrCreateSheet(ss, config.name);
    ensureHeaders(sheet, config.headers);
    if (config.name === "Settings") {
      initializeSettingsMetadata(sheet);
    }
  });

  Logger.log("Initialization completed.");
  return "Initialization completed.";
}

/**
 * Populates default metadata key-value pairs in the Settings sheet if they do not exist.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The Settings sheet.
 */
function initializeSettingsMetadata(sheet) {
  var rows = sheet.getDataRange().getValues();
  var settingsMap = {};
  for (var i = 1; i < rows.length; i++) {
    var key = String(rows[i][0]).trim();
    if (key) {
      settingsMap[key] = true;
    }
  }

  var defaultMetadata = [
    { key: "APP_NAME", value: "Mail2Ledger" },
    { key: "APP_VERSION", value: "1.0.0" },
    { key: "SYNC_INTERVAL", value: "10" },
    { key: "ENABLE_DEBUG", value: "false" }
  ];

  defaultMetadata.forEach(function(item) {
    if (!settingsMap.hasOwnProperty(item.key)) {
      sheet.appendRow([item.key, item.value]);
    }
  });
}

/**
 * Gets an existing sheet by name or creates it if it does not exist.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss The active spreadsheet.
 * @param {string} name The name of the sheet.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The retrieved or created sheet.
 */
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (sheet) {
    Logger.log(name + " already exists");
  } else {
    sheet = ss.insertSheet(name);
    Logger.log("Created sheet: " + name);
  }
  return sheet;
}

/**
 * Checks if a specific row on a sheet is empty.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to check.
 * @param {number} rowNumber The 1-indexed row number.
 * @return {boolean} True if the row is empty, false otherwise.
 */
function isRowEmpty(sheet, rowNumber) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    return true;
  }
  var rowValues = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
  return rowValues.every(function(cell) {
    return cell === "" || cell === null || cell === undefined;
  });
}

/**
 * Ensures a sheet contains headers if the first row is empty.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to verify.
 * @param {string[]} headers The array of header column names.
 */
function ensureHeaders(sheet, headers) {
  if (isRowEmpty(sheet, 1)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

/**
 * Installs and prepares Mail2Ledger for production deployment.
 */
function install() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Detect mode using APP_VERSION prior to initialization
  var existingVersion = "";
  var settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet) {
    var rows = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === "APP_VERSION") {
        existingVersion = String(rows[i][1]).trim();
        break;
      }
    }
  }
  var mode = existingVersion ? "Upgrade" : "Fresh Installation";

  // 2. Initialize spreadsheet (and default metadata keys)
  initializeSpreadsheet();

  // 3. Verify configuration and permissions (read-only)
  var verification = verifyConfiguration();

  // 4. Read settings from sheet
  var settings = {};
  try {
    settings = getSettings() || {};
  } catch (e) {
    // Fallback if settings cannot be read
  }

  var appName = settings["APP_NAME"] || settings["app_name"] || "Mail2Ledger";
  var appVersion = settings["APP_VERSION"] || settings["app_version"] || "1.0.0";
  
  var intervalStr = settings["SYNC_INTERVAL"] || settings["sync_interval"];
  var interval = parseInt(intervalStr, 10);
  if (isNaN(interval) || interval <= 0) {
    interval = 10;
  }

  // 5. Create time trigger
  var triggerInstalled = "No";
  try {
    createTimeTrigger(interval);
    triggerInstalled = "Yes";
  } catch (e) {
    Logger.log("Error setting up trigger: " + e.toString());
  }

  var configStatusText = verification.success ? "Valid" : "Invalid";

  // 6. Print installation summary
  var report = [
    "=====================================",
    "Mail2Ledger Installation",
    "",
    "Application Name: " + appName,
    "Application Version: " + appVersion,
    "Installation Mode: " + mode,
    "Sync Interval: Every " + interval + " Minutes",
    "Configuration Status: " + configStatusText,
    "Trigger Status: " + (triggerInstalled === "Yes" ? "Installed" : "Not Installed"),
    "====================================="
  ].join("\n");

  Logger.log(report);
}

/**
 * Ensures there is exactly one processInbox trigger running every specified minutes.
 * Idempotent: deletes all existing processInbox triggers before creating a new one.
 *
 * @param {number} [interval=10] The interval in minutes.
 */
function createTimeTrigger(interval) {
  var minutes = parseInt(interval, 10);
  if (isNaN(minutes) || minutes <= 0) {
    minutes = 10;
  }
  removeTimeTrigger();
  ScriptApp.newTrigger("processInbox")
    .timeBased()
    .everyMinutes(minutes)
    .create();
}

/**
 * Deletes all triggers set up to run processInbox.
 */
function removeTimeTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var trigger = triggers[i];
    if (trigger.getHandlerFunction() === "processInbox") {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

/**
 * Verifies that all required sheets exist, configuration requirements are met,
 * and necessary Google Apps Script service permissions are authorized in a read-only manner.
 *
 * @return {Object} A structured result report.
 */
function verifyConfiguration() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var requiredSheets = ["Settings", "Accounts", "EmailSenders", "Transactions", "ProcessedEmails"];
  var errors = [];
  var sheetsReady = true;

  // 1. Verify required sheets exist
  requiredSheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      errors.push("Missing sheet: " + name);
      sheetsReady = false;
    }
  });

  // 2. Verify Gmail authorization
  var gmailAuth = false;
  try {
    GmailApp.getInboxUnreadCount();
    gmailAuth = true;
  } catch (e) {
    errors.push("Gmail access is not authorized. Please grant Gmail permissions.");
  }

  // 3. Verify Spreadsheet write access (read-only check)
  var spreadsheetWrite = false;
  try {
    if (!ss.isReadOnly()) {
      spreadsheetWrite = true;
    } else {
      errors.push("Spreadsheet is read-only. Write access is required.");
    }
  } catch (e) {
    errors.push("Spreadsheet write access is not available. Please verify edit permissions.");
  }

  // 4. Verify Trigger creation permission (read-only check)
  var triggerPermission = false;
  try {
    ScriptApp.getProjectTriggers();
    triggerPermission = true;
  } catch (e) {
    errors.push("Trigger creation permission is not available. Please verify trigger permissions.");
  }

  var activeAccounts = [];
  var activeSenders = [];

  // Only load configuration if sheets exist to avoid loading exceptions
  if (sheetsReady) {
    try {
      activeAccounts = loadAccountsFromSheet();
    } catch (e) {
      errors.push("Error loading Accounts: " + e.toString());
    }

    try {
      activeSenders = loadEmailSendersFromSheet();
    } catch (e) {
      errors.push("Error loading EmailSenders: " + e.toString());
    }
  }

  if (activeAccounts.length === 0) {
    errors.push("At least one active account is required.");
  }
  if (activeSenders.length === 0) {
    errors.push("At least one active sender is required.");
  }

  return {
    success: errors.length === 0,
    errors: errors,
    accountsCount: activeAccounts.length,
    sendersCount: activeSenders.length,
    sheetsReady: sheetsReady,
    gmailAuth: gmailAuth,
    spreadsheetWrite: spreadsheetWrite,
    triggerPermission: triggerPermission
  };
}

/**
 * Performs database schema and sheet upgrades between versions.
 *
 * @param {string} currentVersion The version currently installed.
 * @param {string} targetVersion The version being upgraded to.
 */
function migrate(currentVersion, targetVersion) {
  // Empty for future schema and sheet upgrades.
}
