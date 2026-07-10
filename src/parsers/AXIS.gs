/**
 * @file AXIS.gs
 * @description Parser module specifically designed for AXIS Bank transaction alert emails (debit/credit card, netbanking, UPI).
 */

/**
 * Parses AXIS Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseAXIS(context) {
  return createParserStubResult("AXIS", context);
}
