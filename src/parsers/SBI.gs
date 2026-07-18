/**
 * @file SBI.gs
 * @description Parser module specifically designed for SBI Bank transaction alert emails.
 */

// Centralized regular expressions for SBI templates and fields
const SBI_REGEX = {
  spentHeader: /spent\s+on\s+your\s+SBI\s+Credit\s+Card/i,
  card: /ending\s+(\d{4})/i,
  at: /\sat\s+/i,
  rs: /Rs\.?/i,
  datePattern: /\d{2}\/\d{2}\/\d{2}/,
  amount: /Rs\.?\s*([\d,]+(?:\.\d{2})?)\s+spent/i,
  merchant: /at\s+(.*?)\s+on\s+\d{2}\/\d{2}\/\d{2}/i,
  date: /on\s+(\d{2}\/\d{2}\/\d{2})/i
};

// Template definition array
const SBI_TEMPLATES = [
  {
    id: "CARD_PURCHASE",
    matcher: function(body) {
      if (!body) return false;
      return SBI_REGEX.spentHeader.test(body)
          && SBI_REGEX.card.test(body)
          && SBI_REGEX.at.test(body)
          && SBI_REGEX.rs.test(body)
          && SBI_REGEX.datePattern.test(body);
    },
    parser: parseSBICardPurchase
  }
];

/**
 * Parses SBI Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseSBI(context) {
  var body = context.body || "";
  
  for (var i = 0; i < SBI_TEMPLATES.length; i++) {
    var template = SBI_TEMPLATES[i];
    if (template.matcher(body)) {
      return template.parser(context);
    }
  }
  
  var transaction = createParserStubResult("SBI", context);
  transaction.errors.push("Unsupported SBI email template.");
  return transaction;
}

/**
 * Parses SBI Credit Card Purchase transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The parsed transaction object.
 */
function parseSBICardPurchase(context) {
  var transaction = createEmptyTransaction();
  transaction.bank = "SBI";
  transaction.sender = context.from;
  transaction.subject = context.subject;
  transaction.messageId = context.messageId;
  transaction.threadId = context.threadId;
  transaction.rawText = context.body;
  transaction.transactionType = "CARD_PURCHASE";

  var body = context.body || "";
  var errors = [];

  // Extract amount
  var amountStr = extractMatch(body, SBI_REGEX.amount);
  if (amountStr) {
    var amt = parseFloat(amountStr.replace(/,/g, ""));
    transaction.amount = amt;
    transaction.withdrawal = amt;
  } else {
    errors.push("Failed to extract amount.");
  }

  // Extract card identifier (last 4 digits)
  var lastFour = extractMatch(body, SBI_REGEX.card);
  if (lastFour) {
    mapAccountId(transaction, lastFour, context);
  } else {
    errors.push("Failed to extract card identifier.");
  }

  // Extract merchant
  var merchant = extractMatch(body, SBI_REGEX.merchant);
  if (merchant) {
    transaction.particulars = merchant;
  } else {
    errors.push("Failed to extract merchant.");
  }

  // Extract transaction date (DD/MM/YY, stored exactly in that format)
  var dateStr = extractMatch(body, SBI_REGEX.date);
  if (dateStr) {
    transaction.transactionDate = dateStr;
  } else {
    errors.push("Failed to extract transaction date.");
  }

  // Reference and bill numbers are left blank/empty
  transaction.referenceNumber = "";
  transaction.billNumber = "";

  if (errors.length === 0) {
    transaction.success = true;
  } else {
    transaction.success = false;
    transaction.errors = errors;
  }

  // Validate and return
  return validateTransaction(transaction);
}
