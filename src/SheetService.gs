/**
 * @file SheetService.gs
 * @description Helper service for writing parsed transaction data, handling rows, and organizing Google Sheets structures.
 */

/**
 * Writes a parsed transaction object to the Transactions sheet.
 *
 * @param {Object} transaction The transaction object.
 * @return {boolean} True if successfully appended, false otherwise.
 */
function saveTransaction(transaction) {
  try {
    if (!transaction) return false;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Transactions");
    if (!sheet) {
      Logger.log("Transactions sheet not found.");
      return false;
    }
    
    var row = [
      transaction.transactionDate || "",
      transaction.transactionTime || "",
      transaction.bank || "",
      transaction.accountId || "",
      transaction.transactionType || "",
      transaction.referenceNumber || "",
      transaction.particulars || "",
      transaction.billNumber || "",
      transaction.withdrawal === null || transaction.withdrawal === undefined ? "" : transaction.withdrawal,
      transaction.deposit === null || transaction.deposit === undefined ? "" : transaction.deposit,
      transaction.balance === null || transaction.balance === undefined ? "" : transaction.balance,
      transaction.sender || "",
      transaction.subject || "",
      transaction.messageId || ""
    ];
    
    sheet.appendRow(row);
    Logger.log("Successfully saved transaction to sheet.");
    return true;
  } catch (e) {
    Logger.log("Error saving transaction: " + e.toString());
    return false;
  }
}
