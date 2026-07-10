/**
 * @file InboxProcessor.gs
 * @description Orchestrates the production email processing workflow, reading emails, parsing transactions, de-duplicating, and persisting them to sheets.
 */

var InboxProcessor = {
  /**
   * Orchestrates the production email processing workflow for all active senders.
   *
   * @param {Object} [options] Configuration options.
   * @param {number} [options.maxEmailsPerSender=25] Max emails to process per sender.
   * @return {Object} Execution summary object.
   */
  process: function(options) {
    if (!options) options = {};
    var maxEmails = options.maxEmailsPerSender !== undefined ? options.maxEmailsPerSender : 25;

    var summary = {
      sendersProcessed: 0,
      emailsFound: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      successfulWrites: 0,
      processingRate: "",
      startedAt: new Date(),
      finishedAt: null,
      durationMs: 0
    };

    try {
      var config = getConfig(); // Load config once
      var senders = config.emailSenders; // Use cached senders
      
      senders.forEach(function(senderObj) {
        summary.sendersProcessed++;
        var email = senderObj.sender;
        var parserName = senderObj.parser;
        Logger.log("Processing sender: " + email + " using parser: " + parserName);

        var messages = getEmailsForSender(email, maxEmails);
        summary.emailsFound += messages.length;

        messages.forEach(function(message) {
          var messageId = message.getId();
          try {
            // Check for duplication
            if (isMessageProcessed(messageId)) {
              Logger.log("Skipping already processed message: " + messageId);
              summary.skipped++;
              return;
            }

            // Build context, passing cached configuration
            var context = buildEmailContext(message, config);

            // Parse email
            var transaction = parseEmail(context, parserName);
            if (!transaction || !transaction.success) {
              Logger.log("Parsing failed for message " + messageId + ". Errors: " + JSON.stringify(transaction ? transaction.errors : []));
              summary.failed++;
              return;
            }

            // Save transaction
            var saveSucceeded = saveTransaction(transaction);
            if (!saveSucceeded) {
              Logger.log("Failed to save transaction for message: " + messageId);
              summary.failed++;
              return;
            }
            summary.successfulWrites++;

            // Mark processed
            markMessageProcessed(messageId);
            summary.processed++;
          } catch (itemError) {
            Logger.log("Unexpected error processing message " + messageId + ": " + itemError.toString());
            summary.failed++;
          }
        });
      });
    } catch (globalError) {
      Logger.log("Global error in InboxProcessor: " + globalError.toString());
    }

    summary.finishedAt = new Date();
    summary.durationMs = summary.finishedAt.getTime() - summary.startedAt.getTime();
    
    var seconds = Math.round(summary.durationMs / 1000);
    if (seconds === 0) seconds = 1;
    summary.processingRate = summary.emailsFound + " emails / " + seconds + " sec";
    
    return summary;
  }
};
