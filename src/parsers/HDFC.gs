/**
 * @file HDFC.gs
 * @description Parser module specifically designed for HDFC Bank transaction alert emails (debit/credit card, netbanking, UPI).
 */

// Global Regex Constants
const REGEX_AMOUNT = /Rs\.([\d,]+\.\d{2})/i;
const REGEX_DEBIT_ACCOUNT = /account ending\s+(\d{4})/i;
const REGEX_DEBIT_DATE = /on\s+(\d{2}-\d{2}-\d{2})/i;
const REGEX_DEBIT_REFERENCE = /UPI transaction reference no\.\:\s*(\d+)/i;
const REGEX_DEBIT_MERCHANT = /towards VPA\s+[^\s]+\s+\((.*?)\)/i;
const REGEX_DEBIT_VPA = /towards VPA\s+([^\s]+)/i;

const REGEX_CREDIT_ACCOUNT = /ending in (\d{4})/i;
const REGEX_CREDIT_REFERENCE = /(?:UPI Reference No|Reference No|Ref No)\.?\s*:\s*([A-Za-z0-9]+)/i;
const REGEX_CREDIT_SENDER = /Sender\s*:\s*([^\n\r]+)/i;
const REGEX_CREDIT_DATE = /Date\s*:\s*([^\n\r]+)/i;

// Template definition array
const HDFC_TEMPLATES = [
  {
    name: "UPI_DEBIT",
    matches: function(body) {
      return body.includes("is debited")
          && body.includes("towards VPA")
          && body.includes("UPI transaction reference");
    },
    parser: parseHDFCDebit
  },
  {
    name: "UPI_CREDIT",
    matches: function(body) {
      return body.includes("has been successfully credited")
          && body.includes("UPI Reference No.");
    },
    parser: parseHDFCCredit
  }
];

/**
 * Parses HDFC Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseHDFC(context) {
  var body = context.body || "";
  
  for (var i = 0; i < HDFC_TEMPLATES.length; i++) {
    var template = HDFC_TEMPLATES[i];
    if (template.matches(body)) {
      return template.parser(context);
    }
  }
  
  var transaction = createParserStubResult("HDFC", context);
  transaction.errors.push("Unsupported HDFC template.");
  return transaction;
}

/**
 * Parses HDFC UPI Debit transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The parsed transaction object.
 */
function parseHDFCDebit(context) {
  var transaction = createEmptyTransaction();
  transaction.bank = "HDFC";
  transaction.sender = context.from;
  transaction.subject = context.subject;
  transaction.messageId = context.messageId;
  transaction.threadId = context.threadId;
  transaction.rawText = context.body;
  transaction.transactionType = "DEBIT";

  var body = context.body || "";
  var errors = [];

  // Extract amount
  var amountStr = extractMatch(body, REGEX_AMOUNT);
  if (amountStr) {
    var amt = parseFloat(amountStr.replace(/,/g, ""));
    transaction.amount = amt;
    transaction.withdrawal = amt;
  } else {
    errors.push("Failed to extract transaction amount.");
  }

  // Extract account identifier (last four digits)
  var lastFour = extractMatch(body, REGEX_DEBIT_ACCOUNT);
  if (lastFour) {
    mapAccountId(transaction, lastFour, context);
  } else {
    errors.push("Failed to extract account identifier.");
  }

  // Extract reference number
  var ref = extractMatch(body, REGEX_DEBIT_REFERENCE);
  if (ref) {
    transaction.referenceNumber = ref;
  } else {
    errors.push("Failed to extract reference number.");
  }

  // Extract VPA and Merchant
  var merchant = extractMatch(body, REGEX_DEBIT_MERCHANT);
  var vpa = extractMatch(body, REGEX_DEBIT_VPA);
  
  if (vpa) {
    transaction.billNumber = vpa;
  }
  
  if (merchant) {
    transaction.particulars = "UPI TO " + merchant;
  } else if (vpa) {
    transaction.particulars = "UPI TO " + vpa;
  } else {
    errors.push("Failed to extract merchant/particulars.");
  }

  // Extract transaction date
  var dateStr = extractMatch(body, REGEX_DEBIT_DATE);
  if (dateStr) {
    transaction.transactionDate = normalizeDate(dateStr);
  } else {
    errors.push("Failed to extract transaction date.");
  }

  if (errors.length === 0) {
    transaction.success = true;
  } else {
    transaction.success = false;
    transaction.errors = errors;
  }

  // Validate and return
  return validateTransaction(transaction);
}

/**
 * Parses HDFC UPI Credit transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The parsed transaction object.
 */
function parseHDFCCredit(context) {
  var transaction = createEmptyTransaction();
  transaction.bank = "HDFC";
  transaction.sender = context.from;
  transaction.subject = context.subject;
  transaction.messageId = context.messageId;
  transaction.threadId = context.threadId;
  transaction.rawText = context.body;
  transaction.transactionType = "CREDIT";

  var body = context.body || "";
  var errors = [];

  // Extract amount
  var amountStr = extractMatch(body, REGEX_AMOUNT);
  if (amountStr) {
    var amt = parseFloat(amountStr.replace(/,/g, ""));
    transaction.amount = amt;
    transaction.deposit = amt;
  } else {
    errors.push("Failed to extract transaction amount.");
  }

  // Extract account identifier (last four digits)
  var lastFour = extractMatch(body, REGEX_CREDIT_ACCOUNT);
  if (lastFour) {
    mapAccountId(transaction, lastFour, context);
  } else {
    errors.push("Failed to extract account identifier.");
  }

  // Extract reference number
  var ref = extractMatch(body, REGEX_CREDIT_REFERENCE);
  if (ref) {
    transaction.referenceNumber = ref;
  } else {
    errors.push("Failed to extract reference number.");
  }

  // Extract sender name
  var senderName = extractMatch(body, REGEX_CREDIT_SENDER);
  if (senderName) {
    transaction.particulars = senderName;
  } else {
    errors.push("Failed to extract sender name.");
  }

  // Extract transaction date
  var dateStr = extractMatch(body, REGEX_CREDIT_DATE);
  if (dateStr) {
    transaction.transactionDate = normalizeDate(dateStr);
  } else {
    errors.push("Failed to extract transaction date.");
  }

  if (errors.length === 0) {
    transaction.success = true;
  } else {
    transaction.success = false;
    transaction.errors = errors;
  }

  // Validate and return
  return validateTransaction(transaction);
}

