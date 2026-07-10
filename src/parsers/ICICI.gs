/**
 * @file ICICI.gs
 * @description Parser module specifically designed for ICICI Bank transaction alert emails (debit/credit card, netbanking, UPI, pocket wallets).
 */

/**
 * Parses ICICI Bank transaction alert emails.
 *
 * @param {Object} context The email context.
 * @return {Object} The transaction object conforming to the contract.
 */
function parseICICI(context) {
  return createParserStubResult("ICICI", context);
}
