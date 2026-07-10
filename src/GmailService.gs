/**
 * @file GmailService.gs
 * @description Helper service for fetching, reading, and labeling emails related to financial transactions from Gmail.
 */

/**
 * Retrieves up to maxResults newest GmailMessage objects for a specific sender.
 *
 * @param {string} senderEmail The email address of the sender.
 * @param {number} maxResults The maximum number of messages to retrieve.
 * @return {GoogleAppsScript.Gmail.GmailMessage[]} Array of GmailMessage objects.
 */
function getEmailsForSender(senderEmail, maxResults) {
  try {
    var query = "from:" + senderEmail;
    // Query search threads. Using maxResults ensures we search enough threads.
    var threads = GmailApp.search(query, 0, maxResults);
    var messages = [];
    
    threads.forEach(function(thread) {
      var threadMessages = thread.getMessages();
      threadMessages.forEach(function(msg) {
        messages.push(msg);
      });
    });

    // Sort messages by date descending (newest first)
    messages.sort(function(a, b) {
      return b.getDate().getTime() - a.getDate().getTime();
    });

    // Take at most maxResults newest messages
    var result = messages.slice(0, maxResults);
    Logger.log("Retrieved " + result.length + " messages for sender: " + senderEmail);
    return result;
  } catch (e) {
    Logger.log("Error retrieving emails for " + senderEmail + ": " + e.toString());
    return [];
  }
}

/**
 * Safely extracts the plain text body from a GmailMessage and normalizes it.
 *
 * @param {GoogleAppsScript.Gmail.GmailMessage} message The Gmail message.
 * @return {string} The normalized plain text body or empty string if unavailable.
 */
function getPlainTextBody(message) {
  try {
    if (!message) return "";
    var body = message.getPlainBody();
    if (!body) return "";
    return normalizeEmailText(body);
  } catch (e) {
    Logger.log("Error reading message body: " + e.toString());
    return "";
  }
}

/**
 * Logs details of a GmailMessage in a standardized layout, showcasing the normalized body.
 *
 * @param {GoogleAppsScript.Gmail.GmailMessage} message The Gmail message.
 */
function logEmailSummary(message) {
  try {
    if (!message) return;
    var body = getPlainTextBody(message);
    var snippet = body.substring(0, 400);
    
    Logger.log("----------------------------------------");
    Logger.log("Message ID: " + message.getId());
    Logger.log("Thread ID: " + message.getThread().getId());
    Logger.log("Date: " + message.getDate());
    Logger.log("From: " + message.getFrom());
    Logger.log("Subject: " + message.getSubject());
    Logger.log("Snippet: " + snippet);
    Logger.log("----------------------------------------");
  } catch (e) {
    Logger.log("Error logging email summary: " + e.toString());
  }
}
