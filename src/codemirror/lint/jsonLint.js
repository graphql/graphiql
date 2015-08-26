/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */


/**
 * This JSON parser simply walks the input, but does not generate an AST
 * or Value. Instead it returns either an syntax error object, or null.
 *
 * The returned syntax error object:
 *
 *   - message: string
 *   - start: int - the start inclusive offset of the syntax error
 *   - end: int - the end exclusive offset of the syntax error
 *
 */
export function jsonLint(str, looseMode) {
  string = str;
  strLen = str.length;
  end = -1;
  try {
    ch();
    lex();
    if (looseMode) {
      readVal();
    } else {
      readObj();
    }
    expect('EOF');
  } catch (err) {
    return err;
  }
}

var string;
var strLen;
var start;
var end;
var code;
var kind;

function readObj() {
  expect('{');
  if (!skip('}')) {
    do {
      expect('String');
      expect(':');
      readVal();
    } while (skip(','));
    expect('}');
  }
}

function readArr() {
  expect('[');
  if (!skip(']')) {
    do {
      readVal();
    } while (skip(','));
    expect(']');
  }
}

function readVal() {
  switch (kind) {
    case '[': return readArr();
    case '{': return readObj();
    case 'String': return lex();
    default: return expect('Value');
  }
}

function syntaxError(message) {
  return { message, start, end };
}

function expect(str) {
  if (kind === str) {
    return lex();
  }
  throw syntaxError(`Expected ${str} but got ${string.slice(start, end)}.`);
}

function skip(k) {
  if (kind === k) {
    lex();
    return true;
  }
}

function ch() {
  if (end < strLen) {
    end++;
    code = end === strLen ? 0 : string.charCodeAt(end);
  }
}

function lex() {
  while (code === 9 || code === 10 || code === 13 || code === 32) {
    ch();
  }

  if (code === 0) {
    kind = 'EOF';
    return;
  }

  start = end;

  switch (code) {
    // "
    case 34:
      kind = 'String';
      return readString();
    // -
    case 45:
    // 0-9
    case 48: case 49: case 50: case 51: case 52:
    case 53: case 54: case 55: case 56: case 57:
      kind = 'Value';
      return readNumber();
    // f
    case 102:
      if (string.slice(start, start + 5) !== 'false') {
        break;
      }
      end += 4; ch();

      kind = 'Value';
      return;
    // n
    case 110:
      if (string.slice(start, start + 4) !== 'null') {
        break;
      }
      end += 3; ch();

      kind = 'Value';
      return;
    // t
    case 116:
      if (string.slice(start, start + 4) !== 'true') {
        break;
      }
      end += 3; ch();

      kind = 'Value';
      return;
  }

  kind = string[start];
  ch();
}

function readString() {
  ch();
  while (code !== 34) {
    ch();
    if (code === 92) { // \
      ch();
      switch (code) {
        case 34: // '
        case 47: // /
        case 92: // \
        case 98: // b
        case 102: // f
        case 110: // n
        case 114: // r
        case 116: // t
          ch();
          break;
        case 117: // u
          ch();
          readHex();
          readHex();
          readHex();
          readHex();
          break;
        default:
          throw syntaxError('Bad character escape sequence.');
      }
    } else if (end === strLen) {
      throw syntaxError('Unterminated string.');
    }
  }

  if (code === 34) {
    ch();
    return;
  }

  throw syntaxError('Unterminated string.');
}

function readHex() {
  if (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 70) || // A-F
    (code >= 97 && code <= 102)   // a-f
  ) {
    return ch();
  }
  throw syntaxError('Expected hexadecimal digit.');
}

function readNumber() {
  if (code === 45) { // -
    ch();
  }

  if (code === 48) { // 0
    ch();
  } else {
    readDigits();
  }

  if (code === 46) { // .
    ch();
    readDigits();
  }

  if (code === 69 || code === 101) { // E e
    ch();
    if (code === 43 || code === 45) { // + -
      ch();
    }
    readDigits();
  }
}

function readDigits() {
  if (code < 48 || code > 57) { // 0 - 9
    throw syntaxError('Expected decimal digit.');
  }
  do {
    ch();
  } while (code >= 48 && code <= 57); // 0 - 9
}
