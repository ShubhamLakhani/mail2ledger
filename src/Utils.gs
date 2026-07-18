/**
 * @file Utils.gs
 * @description General utility functions for string cleaning, date parsing, and execution logging in Mail2Ledger.
 */

function formatTimestamp(date) {
  Logger.log("Utils formatting timestamp");
  return "";
}

/**
 * Normalizes email body text by cleaning whitespace, removing tracking URLs,
 * and collapsing multiple empty lines.
 *
 * @param {string} text The raw email body text.
 * @return {string} The normalized and cleaned text.
 */
function normalizeEmailText(text) {
  if (text === null || text === undefined) {
    return "";
  }
  
  // 1. Convert Windows line endings to Unix (\r\n to \n)
  var cleanText = String(text).replace(/\r\n/g, "\n");
  
  // 2. Remove leading and trailing whitespace of the overall string
  cleanText = cleanText.trim();
  
  // 3. Remove tracking URLs (lines containing http://, https://, or <http)
  var lines = cleanText.split("\n");
  var linesWithoutUrls = lines.filter(function(line) {
    return line.indexOf("http://") === -1 &&
           line.indexOf("https://") === -1 &&
           line.indexOf("<http") === -1;
  });
  
  // 4. Collapse multiple blank lines (maximum one empty line between paragraphs)
  var collapsedLines = [];
  var previousWasBlank = false;
  for (var i = 0; i < linesWithoutUrls.length; i++) {
    var line = linesWithoutUrls[i];
    var isBlank = (line.trim() === "");
    if (isBlank) {
      if (!previousWasBlank) {
        collapsedLines.push("");
        previousWasBlank = true;
      }
    } else {
      collapsedLines.push(line);
      previousWasBlank = false;
    }
  }
  
  // 5. Trim every line
  var trimmedLines = collapsedLines.map(function(line) {
    return line.trim();
  });
  
  // 6. Remove empty lines at the beginning and end
  while (trimmedLines.length > 0 && trimmedLines[0] === "") {
    trimmedLines.shift();
  }
  while (trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1] === "") {
    trimmedLines.pop();
  }
  
  // 7. Return normalized text
  return trimmedLines.join("\n");
}

/**
 * Normalizes transaction dates from DD-MM-YY or DD/MM/YY to YYYY-MM-DD.
 *
 * @param {string} dateString The raw date string.
 * @return {string} The normalized YYYY-MM-DD date or empty string if failed.
 */
function normalizeDate(dateString) {
  try {
    if (!dateString) return "";
    var cleaned = String(dateString).trim();
    // Match DD-MM-YY or DD/MM/YY
    var match = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
    if (!match) return "";
    
    var day = match[1];
    var month = match[2];
    var year = match[3];
    
    // Ensure two digits for day and month
    if (day.length === 1) day = "0" + day;
    if (month.length === 1) month = "0" + month;
    
    // Convert two digit year to 20XX
    if (year.length === 2) {
      year = "20" + year;
    }
    
    // Simple validation of parsed numbers
    var d = parseInt(day, 10);
    var m = parseInt(month, 10);
    var y = parseInt(year, 10);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) {
      return "";
    }
    
    return year + "-" + month + "-" + day;
  } catch (e) {
    return "";
  }
}

/**
 * Safely executes a regular expression on text and returns the trimmed first capture group.
 *
 * @param {string} text The target text.
 * @param {RegExp} regex The regular expression containing at least one capture group.
 * @return {string|null} Trimmed match value if found, null otherwise.
 */
function extractMatch(text, regex) {
  if (!text || !regex) return null;
  var match = String(text).match(regex);
  if (match && match[1] !== undefined && match[1] !== null) {
    return String(match[1]).trim();
  }
  return null;
}

/**
 * Maps the account identifier (e.g. last 4 digits) to account ID using O(1) lookup.
 *
 * @param {Object} transaction The transaction object to update.
 * @param {string} identifier The account identifier.
 * @param {Object} [context] The parser context containing cache.
 */
function mapAccountId(transaction, identifier, context) {
  var lookup = context && context.config ? context.config.accountsLookup : null;
  if (lookup) {
    var matchedAccount = lookup[identifier];
    if (matchedAccount) {
      transaction.accountId = matchedAccount.accountId;
    }
  } else {
    // Fallback lookup if context/config is not populated
    var accounts = getAccounts();
    var matchedAccount = accounts.find(function(acc) {
      return String(acc.identifier).trim() === identifier;
    });
    if (matchedAccount) {
      transaction.accountId = matchedAccount.accountId;
    }
  }
}

