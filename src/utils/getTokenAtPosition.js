/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

type ContextToken<TState> = {
  start: Number,
  end: Number,
  string: string,
  state: TState,
  type: string
};

 /**
  * Provides an utility function to construct a `token` context object.
  * A token context provides useful information about the token/style
  * that CharacterStream currently possesses.
  *
  * Options:
  *   - stream: CharacterStream.
  *   - state: A state object from onlineParser.
  *   - style: A style string obtained by running `token` function from
  *     onlineParser.
  */

export default function getTokenAtPosition<TState>(
  stream, // : CharacterStream
  state: TState,
  style: string
): ContextToken {
  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    state,
    style
  };
}
