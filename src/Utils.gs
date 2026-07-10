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
