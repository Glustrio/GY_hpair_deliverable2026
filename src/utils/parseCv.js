// Pulls what it can from CV text using patterns, no AI service. Phone numbers and
// LinkedIn URLs have a shape; a name and an address do not, so those are guesses and
// the UI asks before filling anything in.

const NAME_LINE = /^[\p{Lu}][\p{L}'’-]+(?:\s+[\p{L}'’.-]+){1,3}$/u;
const NOT_A_NAME = /\b(curriculum|vitae|resume|résumé|cv|education|experience|skills|profile|summary)\b/i;
const PHONE = /(?:\+\d[\d ().-]{6,18}\d)|(?:\(\d{3}\) ?\d{3}[ .-]?\d{4})|(?:\b\d{3}[ .-]\d{3}[ .-]\d{4}\b)/;
const LINKEDIN = /(?:[a-z]{1,3}\.)?linkedin\.com\/(?:in|pub)\/[^\s|,)]+/i;
// A street line usually opens with a number and carries at least one comma.
const ADDRESS = /^\d+[^,\n]{3,},[^\n]{5,}$/;

export const parseCv = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const found = {};

  const nameLine = lines
    .slice(0, 8)
    .find((line) => NAME_LINE.test(line) && !NOT_A_NAME.test(line));
  if (nameLine) {
    const parts = nameLine.split(/\s+/);
    found.firstName = parts[0];
    found.lastName = parts[parts.length - 1];
  }

  // Per line, and only if the digit count is a plausible phone number.
  for (const line of lines) {
    const match = line.match(PHONE);
    const digits = match ? match[0].replace(/\D/g, '') : '';
    if (digits.length >= 7 && digits.length <= 15) {
      found.phone = match[0].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  const linkedin = text.match(LINKEDIN);
  if (linkedin) found.linkedinUrl = linkedin[0];

  const address = lines.find((line) => ADDRESS.test(line) && line.length < 120);
  if (address) found.address = address;

  return found;
};
