// Unicode whitespace characters that break the interface.
export const invalidCharacters = Array.from({ length: 11 }, (_, i) => {
  // \u2000 -> \u200a
  return String.fromCharCode(0x2000 + i);
}).concat(['\u2028', '\u2029', '\u202f', '\u00a0']);

const sanitizeRegex = new RegExp('[' + invalidCharacters.join('') + ']', 'g');

export function normalizeWhitespace(line: string) {
  return line.replace(sanitizeRegex, ' ');
}
