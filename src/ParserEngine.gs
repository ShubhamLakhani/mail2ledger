/**
 * @file ParserEngine.gs
 * @description Engine that orchestrates selecting the correct bank parser depending on the email sender/subject and extracts transaction details.
 */

/**
 * Standard registry of bank parser modules.
 */
var PARSER_REGISTRY = {
  HDFC: function(context) { return parseHDFC(context); },
  SBI: function(context) { return parseSBI(context); },
  ICICI: function(context) { return parseICICI(context); },
  AXIS: function(context) { return parseAXIS(context); },
  YES: function(context) { return parseYES(context); }
};

/**
 * Orchestrates selecting the correct bank parser depending on the configured parser name.
 *
 * @param {Object} context The email context.
 * @param {string} parserName The name of the bank parser (e.g. "HDFC").
 * @return {Object} Transaction object.
 */
function parseEmail(context, parserName) {
  var transaction = createEmptyTransaction();
  
  try {
    var cleanedName = (parserName || "").trim().toUpperCase();
    if (!cleanedName || !PARSER_REGISTRY[cleanedName]) {
      transaction.errors.push("Unknown parser.");
      return transaction;
    }
    
    var parseFunc = PARSER_REGISTRY[cleanedName];
    return parseFunc(context);
  } catch (e) {
    transaction.success = false;
    transaction.errors.push("Unexpected error: " + e.toString());
    return transaction;
  }
}

/**
 * Builds a standardized email context object from a GmailMessage.
 *
 * @param {GoogleAppsScript.Gmail.GmailMessage} message The Gmail message.
 * @return {Object} Standardized email context.
 */
function buildEmailContext(message) {
  return {
    messageId: message.getId(),
    threadId: message.getThread().getId(),
    from: message.getFrom(),
    subject: message.getSubject(),
    date: message.getDate(),
    body: getPlainTextBody(message)
  };
}

/**
 * Returns an empty transaction object conforming to the transaction contract.
 *
 * @return {Object} An empty transaction object.
 */
function createEmptyTransaction() {
  return {
    success: false,
    bank: "",
    accountId: "",
    transactionType: "",
    transactionDate: "",
    transactionTime: "",
    amount: null,
    withdrawal: null,
    deposit: null,
    balance: null,
    referenceNumber: "",
    particulars: "",
    billNumber: "",
    sender: "",
    subject: "",
    messageId: "",
    threadId: "",
    rawText: "",
    errors: []
  };
}

/**
 * Helper to construct the standard parser stub response.
 *
 * @param {string} bank The bank name.
 * @param {Object} context The email context.
 * @return {Object} Transaction response stub.
 */
function createParserStubResult(bank, context) {
  var transaction = createEmptyTransaction();
  transaction.success = false;
  transaction.bank = bank;
  transaction.rawText = context.body;
  transaction.subject = context.subject;
  transaction.sender = context.from;
  transaction.messageId = context.messageId;
  transaction.threadId = context.threadId;
  return transaction;
}
