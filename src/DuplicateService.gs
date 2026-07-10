/**
 * @file DuplicateService.gs
 * @description Service to detect and prevent duplicate logging of transaction records using unique transaction IDs or email message IDs.
 */

/**
 * Checks if a Gmail message has already been processed by checking the ProcessedEmails sheet.
 *
 * @param {string} messageId The Gmail message ID.
 * @return {boolean} True if the message has been processed, false otherwise.
 */
function isMessageProcessed(messageId) {
  if (!messageId) return false;
  var cleanId = String(messageId).trim();
  var rows = getProcessedEmailsData();
  for (var i = 0; i < rows.length; i++) {
    var storedId = String(rows[i][0]).trim();
    if (storedId === cleanId) {
      return true;
    }
  }
  return false;
}

/**
 * Appends a Gmail message ID and the current timestamp to the ProcessedEmails sheet.
 *
 * @param {string} messageId The Gmail message ID.
 * @return {boolean} True if successfully marked, false otherwise.
 */
function markMessageProcessed(messageId) {
  try {
    if (!messageId) return false;
    var cleanId = String(messageId).trim();
    
    // Check again to make sure it doesn't get appended twice in close successions
    if (isMessageProcessed(cleanId)) {
      return true;
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("ProcessedEmails");
    if (!sheet) return false;
    
    var timestamp = new Date();
    sheet.appendRow([cleanId, timestamp]);
    return true;
  } catch (e) {
    Logger.log("Error marking message as processed: " + e.toString());
    return false;
  }
}

/**
 * Returns the total count of processed emails.
 *
 * @return {number} Count of processed emails.
 */
function getProcessedMessageCount() {
  var rows = getProcessedEmailsData();
  return rows.length;
}

/**
 * Reads data from the ProcessedEmails sheet, excluding header and empty rows.
 *
 * @return {Array<Array<any>>} Matched data rows.
 */
function getProcessedEmailsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ProcessedEmails");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var range = sheet.getRange(2, 1, lastRow - 1, 2);
  var values = range.getValues();
  return values.filter(function(row) {
    return row[0] !== null && row[0] !== undefined && String(row[0]).trim() !== "";
  });
}
