/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  CharacterStream,
  onlineParser,
  ParserOptions,
  State,
} from 'graphql-language-service';

export default function runParser(
  sourceText: string,
  parserOptions: ParserOptions,
  callbackFn: (stream: CharacterStream, state: State, style: string) => void,
) {
  const parser = onlineParser(parserOptions);
  const state = parser.startState();
  const lines = sourceText.split('\n');

  for (const line of lines) {
    const stream = new CharacterStream(line);
    while (!stream.eol()) {
      const style = parser.token(stream, state);
      callbackFn(stream, state, style);
    }
  }
}
