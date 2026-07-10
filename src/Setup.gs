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
  });

  Logger.log("Initialization completed.");
  return "Initialization completed.";
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

