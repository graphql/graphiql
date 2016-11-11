/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * CharacterStream implements a stream of character tokens given a source text.
 * The API design follows that of CodeMirror.StringStream.
 *
 * Required:
 *
 *      sourceText: (string), A raw GraphQL source text. Works best if a line
 *        is supplied.
 *
 */

export default class CharacterStream {
  constructor(sourceText: string): void {
    this._start = 0;
    this._pos = 0;
    this._sourceText = sourceText;
  }

  getStartOfToken(): Number {
    return this._start;
  }

  getCurrentPosition(): Number {
    return this._pos;
  }

  _testNextCharacter(pattern: mixed) {
    const character = this._sourceText.charAt(this._pos);
    return typeof pattern === 'string' ? character === pattern :
      pattern.test ? pattern.test(character) :
      pattern(character);
  }

  eol(): boolean {
    return this._sourceText.length === this._pos;
  }

  sol(): boolean {
    return this._pos === 0;
  }

  peek(): string | void {
    return this._sourceText.charAt(this._pos) ?
      this._sourceText.charAt(this._pos) : null;
  }

  next(): string {
    const char = this._sourceText.charAt(this._pos);
    this._pos ++;
    return char;
  }

  eat(pattern: mixed): string | void {
    const isMatched = this._testNextCharacter(pattern);
    if (isMatched) {
      this._start = this._pos;
      this._pos ++;
      return this._sourceText.charAt(this._pos - 1);
    }
    return undefined;
  }

  eatWhile(match: mixed): boolean {
    let isMatched = this._testNextCharacter(match);
    let didEat = false;

    // If a match, treat the total upcoming matches as one token
    if (isMatched) {
      didEat = isMatched;
      this._start = this._pos;
    }

    while (isMatched) {
      this._pos ++;
      isMatched = this._testNextCharacter(match);
      didEat = true;
    }

    return didEat;
  }

  eatSpace(): boolean {
    return this.eatWhile(/[\s\u00a0]/);
  }

  skipToEnd(): void {
    this._pos = this._sourceText.length;
  }

  skipTo(position): void {
    this._pos = position;
  }

  match(
    pattern: mixed,
    consume: ?boolean = true,
    caseFold: boolean
  ): Array<string> | boolean {
    let token = null;
    let match = null;

    switch (typeof pattern) {
      case 'string':
        const regex = new RegExp(pattern, (caseFold ? 'i' : ''));
        match = regex.test(this._sourceText.substr(this._pos, pattern.length));
        token = pattern;
        break;
      case 'object': // RegExp
      case 'function':
        match = this._sourceText.slice(this._pos).match(pattern);
        token = match && match[0];
        break;
    }

    if (
      match && (
        typeof pattern === 'string' ||
        match.index === 0
      )
    ) {
      if (consume) {
        this._start = this._pos;
        this._pos += token.length;
      }
      return match;
    }

    // No match available.
    return false;
  }

  backUp(num: number): void {
    this._pos -= num;
  }

  column(): number {
    return this._pos;
  }

  indentation(): number {
    const match = this._sourceText.match(/\s*/);
    let indent = 0;
    if (match && match.index === 0) {
      const whitespaces = match[0];
      let pos = 0;
      while (whitespaces.length > pos) {
        if (whitespaces.charCodeAt(pos) === 9) {
          indent += 2;
        } else {
          indent++;
        }
        pos++;
      }
    }

    return indent;
  }

  current(): string {
    return this._sourceText.slice(this._start, this._pos);
  }
}
