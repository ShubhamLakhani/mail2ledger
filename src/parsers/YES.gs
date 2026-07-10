/**
 * @file YES.gs
 * @description Parser module specifically designed for YES Bank transaction alert emails (debit/credit card, netbanking, UPI).
 */

/**
 * Parses YES Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseYES(context) {
  return createParserStubResult("YES", context);
}
