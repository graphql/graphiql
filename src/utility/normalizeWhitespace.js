/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

// Unicode whitespace characters that break the interface.
export const invalidCharacters = Array.from({ length: 11 }, (x, i) => {
  // \u2000 -> \u200a
  return String.fromCharCode(0x2000 + i);
}).concat(['\u2028', '\u2029', '\u202f']);

const sanitizeRegex = new RegExp('[' + invalidCharacters.join('|') + ']', 'g');

export function normalizeWhitespace(line) {
  return line.replace(sanitizeRegex, ' ');
}
