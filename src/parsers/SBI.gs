/**
 * @file SBI.gs
 * @description Parser module specifically designed for SBI Bank transaction alert emails (UPI, debit/credit cards, ATM withdrawals).
 */

/**
 * Parses SBI Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseSBI(context) {
  return createParserStubResult("SBI", context);
}
