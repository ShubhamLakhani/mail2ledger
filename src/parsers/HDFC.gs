/**
 * @file HDFC.gs
 * @description Parser module specifically designed for HDFC Bank transaction alert emails (debit/credit card, netbanking, UPI).
 */

/**
 * Parses HDFC Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseHDFC(context) {
  var body = context.body || "";
  
  if (body.indexOf("is debited") !== -1) {
    return parseHDFCDebit(context);
  } else if (body.indexOf("has been successfully credited") !== -1) {
    return parseHDFCCredit(context);
  } else {
    var transaction = createParserStubResult("HDFC", context);
    transaction.errors.push("Unsupported HDFC email template.");
    return transaction;
  }
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
  var amountMatch = body.match(/Rs\.?\s*([\d,]+\.\d{2})/i);
  if (amountMatch) {
    var amt = parseFloat(amountMatch[1].replace(/,/g, ""));
    transaction.amount = amt;
    transaction.withdrawal = amt;
  } else {
    errors.push("Failed to extract transaction amount.");
  }

  // Extract account identifier (last four digits)
  var accountMatch = body.match(/ending in (\d{4})/i);
  if (accountMatch) {
    var lastFour = accountMatch[1];
    mapAccountId(transaction, lastFour);
  } else {
    errors.push("Failed to extract account identifier.");
  }

  // Extract reference number
  var refMatch = body.match(/(?:Reference No|Ref No|UPI Reference No)\.?\s*:\s*([A-Za-z0-9]+)/i);
  if (refMatch) {
    transaction.referenceNumber = refMatch[1].trim();
  } else {
    errors.push("Failed to extract reference number.");
  }

  // Extract merchant / particulars
  var partMatch = body.match(/(?:Merchant\s*\/\s*Particulars|Merchant|Particulars)\s*:\s*([^\n\r]+)/i);
  if (partMatch) {
    transaction.particulars = partMatch[1].trim();
  } else {
    errors.push("Failed to extract merchant/particulars.");
  }

  // Extract transaction date
  var dateMatch = body.match(/Date\s*:\s*([^\n\r]+)/i);
  if (dateMatch) {
    transaction.transactionDate = dateMatch[1].trim();
  }

  if (errors.length === 0) {
    transaction.success = true;
  } else {
    transaction.success = false;
    transaction.errors = errors;
  }

  return transaction;
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
  var amountMatch = body.match(/Rs\.?\s*([\d,]+\.\d{2})/i);
  if (amountMatch) {
    var amt = parseFloat(amountMatch[1].replace(/,/g, ""));
    transaction.amount = amt;
    transaction.deposit = amt;
  } else {
    errors.push("Failed to extract transaction amount.");
  }

  // Extract account identifier (last four digits)
  var accountMatch = body.match(/ending in (\d{4})/i);
  if (accountMatch) {
    var lastFour = accountMatch[1];
    mapAccountId(transaction, lastFour);
  } else {
    errors.push("Failed to extract account identifier.");
  }

  // Extract reference number
  var refMatch = body.match(/(?:UPI Reference No|Reference No|Ref No)\.?\s*:\s*([A-Za-z0-9]+)/i);
  if (refMatch) {
    transaction.referenceNumber = refMatch[1].trim();
  } else {
    errors.push("Failed to extract reference number.");
  }

  // Extract sender name
  var senderMatch = body.match(/Sender\s*:\s*([^\n\r]+)/i);
  if (senderMatch) {
    transaction.particulars = senderMatch[1].trim();
  } else {
    errors.push("Failed to extract sender name.");
  }

  // Extract transaction date
  var dateMatch = body.match(/Date\s*:\s*([^\n\r]+)/i);
  if (dateMatch) {
    transaction.transactionDate = dateMatch[1].trim();
  } else {
    errors.push("Failed to extract transaction date.");
  }

  if (errors.length === 0) {
    transaction.success = true;
  } else {
    transaction.success = false;
    transaction.errors = errors;
  }

  return transaction;
}

/**
 * Maps the account last 4 digits identifier to account ID from Accounts sheet.
 *
 * @param {Object} transaction The transaction object to update.
 * @param {string} lastFour The 4-digit account identifier.
 */
function mapAccountId(transaction, lastFour) {
  var accounts = getAccounts();
  var matchedAccount = accounts.find(function(acc) {
    return String(acc.identifier).trim() === lastFour;
  });
  if (matchedAccount) {
    transaction.accountId = matchedAccount.accountId;
  }
}
