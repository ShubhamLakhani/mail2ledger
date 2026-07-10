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

function inspectSingleEmail() {
  const message = GmailApp.search('from:alerts@hdfcbank.bank.in', 0, 1)[0].getMessages()[0];

  Logger.log("========== PLAIN BODY ==========");
  Logger.log(message.getPlainBody());

  Logger.log("========== BODY ==========");
  Logger.log(message.getBody());

  Logger.log("========== NORMALIZED BODY ==========");
  Logger.log(getPlainTextBody(message));

  Logger.log("========== SNIPPET ==========");
  Logger.log(getPlainTextBody(message).substring(0, 400));
}

/**
 * Orchestrates testing the Parser Engine infrastructure.
 * Retrieves the latest email for each active sender, builds the context,
 * runs it through the parser engine, and logs the resulting transaction object.
 */
function runParserEngineTest() {
  var senders = getEmailSenders();
  senders.forEach(function(senderObj) {
    var email = senderObj.sender;
    var parserName = senderObj.parser;
    Logger.log("Testing parser for sender: " + email + " using parser: " + parserName);
    
    var messages = getEmailsForSender(email, 1);
    if (messages.length > 0) {
      var message = messages[0];
      var messageId = message.getId();
      
      if (isMessageProcessed(messageId)) {
        Logger.log("Skipping already processed message: " + messageId);
        return;
      }
      
      var context = buildEmailContext(message);
      var transaction = parseEmail(context, parserName);
      
      if (transaction && transaction.success) {
        Logger.log("Parsed transaction: " + JSON.stringify(transaction));
        var saveSucceeded = saveTransaction(transaction);
        if (saveSucceeded) {
          markMessageProcessed(messageId);
          Logger.log("Message marked as processed.");
        } else {
          Logger.log("Failed to save transaction. Message NOT marked as processed.");
        }
      } else {
        Logger.log("Parsing failed or skipped for message: " + messageId + ". Errors: " + JSON.stringify(transaction ? transaction.errors : []));
      }
    } else {
      Logger.log("No emails found for sender: " + email);
    }
  });
}

/**
 * Production entry point that processes the inbox and logs a summary report.
 */
function processInbox() {
  var summary = InboxProcessor.process({ maxEmailsPerSender: 25 });
  
  Logger.log("================================");
  Logger.log("Mail2Ledger Summary");
  Logger.log("Senders: " + summary.sendersProcessed);
  Logger.log("Emails Found: " + summary.emailsFound);
  Logger.log("Processed: " + summary.processed);
  Logger.log("Skipped: " + summary.skipped);
  Logger.log("Failed: " + summary.failed);
  Logger.log("Successful Writes: " + summary.successfulWrites);
  Logger.log("Processing Rate: " + summary.processingRate);
  Logger.log("Duration: " + summary.durationMs + " ms");
  Logger.log("================================");
}