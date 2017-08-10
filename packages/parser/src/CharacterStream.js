/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
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

import type {
  TokenPattern,
  CharacterStream as CharacterStreamInterface,
} from 'graphql-language-service-types';

export default class CharacterStream implements CharacterStreamInterface {
  _start: number;
  _pos: number;
  _sourceText: string;

  constructor(sourceText: string): void {
    this._start = 0;
    this._pos = 0;
    this._sourceText = sourceText;
  }

  getStartOfToken = (): number => this._start;

  getCurrentPosition = (): number => this._pos;

  _testNextCharacter(pattern: TokenPattern): boolean {
    const character = this._sourceText.charAt(this._pos);
    let isMatched = false;
    if (typeof pattern === 'string') {
      isMatched = character === pattern;
    } else {
      isMatched = pattern instanceof RegExp
        ? pattern.test(character)
        : pattern(character);
    }
    return isMatched;
  }

  eol = (): boolean => this._sourceText.length === this._pos;

  sol = (): boolean => this._pos === 0;

  peek = (): string | null => {
    return this._sourceText.charAt(this._pos)
      ? this._sourceText.charAt(this._pos)
      : null;
  };

  next = (): string => {
    const char = this._sourceText.charAt(this._pos);
    this._pos++;
    return char;
  };

  eat = (pattern: TokenPattern): string | void => {
    const isMatched = this._testNextCharacter(pattern);
    if (isMatched) {
      this._start = this._pos;
      this._pos++;
      return this._sourceText.charAt(this._pos - 1);
    }
    return undefined;
  };

  eatWhile = (match: TokenPattern): boolean => {
    let isMatched = this._testNextCharacter(match);
    let didEat = false;

    // If a match, treat the total upcoming matches as one token
    if (isMatched) {
      didEat = isMatched;
      this._start = this._pos;
    }

    while (isMatched) {
      this._pos++;
      isMatched = this._testNextCharacter(match);
      didEat = true;
    }

    return didEat;
  };

  eatSpace = (): boolean => this.eatWhile(/[\s\u00a0]/);

  skipToEnd = (): void => {
    this._pos = this._sourceText.length;
  };

  skipTo = (position: number): void => {
    this._pos = position;
  };

  match = (
    pattern: TokenPattern,
    consume: ?boolean = true,
    caseFold: ?boolean = false,
  ): Array<string> | boolean => {
    let token = null;
    let match = null;

    if (typeof pattern === 'string') {
      const regex = new RegExp(pattern, caseFold ? 'i' : 'g');
      match = regex.test(this._sourceText.substr(this._pos, pattern.length));
      token = pattern;
    } else if (pattern instanceof RegExp) {
      match = this._sourceText.slice(this._pos).match(pattern);
      token = match && match[0];
    }

    if (match != null) {
      if (
        typeof pattern === 'string' ||
        (match instanceof Array &&
          // String.match returns 'index' property, which flow fails to detect
          // for some reason. The below is a workaround, but an easier solution
          // is just checking if `match.index === 0`
          this._sourceText.startsWith(match[0], this._pos))
      ) {
        if (consume) {
          this._start = this._pos;
          if (token && token.length) {
            this._pos += token.length;
          }
        }
        return match;
      }
    }

    // No match available.
    return false;
  };

  backUp = (num: number): void => {
    this._pos -= num;
  };

  column = (): number => this._pos;

  indentation = (): number => {
    const match = this._sourceText.match(/\s*/);
    let indent = 0;
    if (match && match.length === 0) {
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
  };

  current = (): string => this._sourceText.slice(this._start, this._pos);
}
