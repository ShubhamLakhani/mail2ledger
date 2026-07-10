/**
 * @file Main.gs
 * @description Main entry point for the Mail2Ledger application. Coordinates the flow of scanning emails, parsing transaction data, and appending to the ledger.
 */

function runMail2Ledger() {
  Logger.log("Mail2Ledger execution started");
  Logger.log(JSON.stringify(getSettings()));
  Logger.log(JSON.stringify(getAccounts()));
  Logger.log(JSON.stringify(getEmailSenders()));
}

/**
 * Orchestrates the Gmail retrieval service test.
 * Loads active senders, queries for the latest 5 emails for each, and logs their summaries.
 */
function runEmailRetrievalTest() {
  var senders = getEmailSenders();
  senders.forEach(function(senderObj) {
    var email = senderObj.sender;
    Logger.log("Checking sender: " + email);
    
    var messages = getEmailsForSender(email, 5);
    Logger.log("Found " + messages.length + " emails.");
    
    messages.forEach(function(message) {
      logEmailSummary(message);
    });
  });
}

