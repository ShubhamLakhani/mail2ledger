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
 * @param {Object} [config] Configuration object.
 * @return {Object} Standardized email context.
 */
function buildEmailContext(message, config) {
  return {
    messageId: message.getId(),
    threadId: message.getThread().getId(),
    from: message.getFrom(),
    subject: message.getSubject(),
    date: message.getDate(),
    body: getPlainTextBody(message),
    config: config || getConfig()
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

/**
 * Validates a transaction object against required fields and updates success and errors list.
 *
 * @param {Object} transaction The transaction object.
 * @return {Object} The updated transaction object.
 */
function validateTransaction(transaction) {
  if (!transaction) return transaction;
  
  var errors = transaction.errors || [];
  var hasMissing = false;
  
  if (!transaction.bank || String(transaction.bank).trim() === "") {
    errors.push("Missing bank");
    hasMissing = true;
  }
  if (!transaction.accountId || String(transaction.accountId).trim() === "") {
    errors.push("Missing account mapping");
    hasMissing = true;
  }
  if (!transaction.transactionType || String(transaction.transactionType).trim() === "") {
    errors.push("Missing transaction type");
    hasMissing = true;
  }
  if (transaction.amount === null || transaction.amount === undefined || isNaN(transaction.amount)) {
    errors.push("Missing transaction amount");
    hasMissing = true;
  }
  var isRefRequired = transaction.transactionType !== "CARD_PURCHASE";
  if (isRefRequired && (!transaction.referenceNumber || String(transaction.referenceNumber).trim() === "")) {
    errors.push("Missing reference number");
    hasMissing = true;
  }
  if (!transaction.transactionDate || String(transaction.transactionDate).trim() === "") {
    errors.push("Missing transaction date");
    hasMissing = true;
  }
  
  if (hasMissing) {
    transaction.success = false;
  }
  transaction.errors = errors;
  return transaction;
}
