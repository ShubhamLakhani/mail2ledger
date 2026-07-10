/**
 * @file Config.gs
 * @description Centralized configuration variables, labels, and Spreadsheet IDs for Mail2Ledger.
 */

/**
 * Retrieves all configuration settings from the Settings sheet.
 *
 * @return {Object} An object containing key/value configuration pairs.
 */
function getSettings() {
  var rows = getSheetData("Settings");
  var settings = {};
  
  rows.forEach(function(row) {
    if (row.length < 2) return;
    var key = cleanString(row[0]);
    var value = cleanString(row[1]);
    if (key !== "") {
      settings[key] = value;
    }
  });
  
  Logger.log("Retrieved settings: " + JSON.stringify(settings));
  return settings;
}

/**
 * Retrieves all active account configurations from the Accounts sheet.
 *
 * @return {Array<Object>} An array of active account objects.
 */
function getAccounts() {
  var rows = getSheetData("Accounts");
  var accounts = [];
  
  rows.forEach(function(row) {
    if (row.length < 6) return;
    var activeVal = row[5];
    if (isActive(activeVal)) {
      accounts.push({
        accountId: cleanString(row[0]),
        accountName: cleanString(row[1]),
        bank: cleanString(row[2]),
        type: cleanString(row[3]),
        identifier: cleanString(row[4]),
        active: true
      });
    }
  });
  
  Logger.log("Retrieved active accounts count: " + accounts.length);
  return accounts;
}

/**
 * Retrieves all active email senders mapped to their respective banks.
 *
 * @return {Array<Object>} An array of active email sender configurations.
 */
function getEmailSenders() {
  var headers = getSheetHeaders("EmailSenders");
  var bankIdx = headers.indexOf("Bank");
  var senderIdx = headers.indexOf("Sender Email");
  var parserIdx = headers.indexOf("Parser");
  var activeIdx = headers.indexOf("Active");

  // Fallback to absolute index values if header layout is missing or unreadable
  if (bankIdx === -1) bankIdx = 0;
  if (senderIdx === -1) senderIdx = 1;
  if (activeIdx === -1) {
    activeIdx = parserIdx === -1 ? 2 : 3;
  }

  var rows = getSheetData("EmailSenders");
  var senders = [];
  
  rows.forEach(function(row) {
    var activeVal = activeIdx < row.length ? row[activeIdx] : false;
    if (isActive(activeVal)) {
      senders.push({
        bank: bankIdx < row.length ? cleanString(row[bankIdx]) : "",
        sender: senderIdx < row.length ? cleanString(row[senderIdx]) : "",
        parser: (parserIdx !== -1 && parserIdx < row.length) ? cleanString(row[parserIdx]) : "",
        active: true
      });
    }
  });
  
  Logger.log("Retrieved active email senders count: " + senders.length);
  return senders;
}

/**
 * Reads a sheet's headers (row 1).
 *
 * @param {string} sheetName The name of the sheet.
 * @return {string[]} Array of header values, cleaned and trimmed.
 */
function getSheetHeaders(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return [];
  var headersRange = sheet.getRange(1, 1, 1, lastColumn);
  var values = headersRange.getValues()[0];
  return values.map(function(val) {
    return cleanString(val);
  });
}

/**
 * Reads a sheet's data, excluding the header row, and filters out blank rows.
 *
 * @param {string} sheetName The name of the sheet.
 * @return {Array<Array<any>>} Array of data rows (excluding headers), where each row is an array of cell values.
 */
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Sheet not found: " + sheetName);
    return [];
  }
  
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  
  if (lastRow <= 1 || lastColumn === 0) {
    return [];
  }
  
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  var values = dataRange.getValues();
  
  // Filter out blank rows where all cell values are empty strings/null/undefined
  return values.filter(function(row) {
    return !row.every(function(cell) {
      return cell === "" || cell === null || cell === undefined;
    });
  });
}

/**
 * Helper to safely convert cell to string and trim it.
 *
 * @param {any} val The cell value.
 * @return {string} Trimmed string.
 */
function cleanString(val) {
  if (val === null || val === undefined) {
    return "";
  }
  return String(val).trim();
}

/**
 * Evaluates whether a cell value represents an active status (e.g., TRUE, "Yes", "yes", "true").
 *
 * @param {any} value The value to check.
 * @return {boolean} True if active, false otherwise.
 */
function isActive(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  var str = cleanString(value).toLowerCase();
  return str === "true" || str === "yes";
}

