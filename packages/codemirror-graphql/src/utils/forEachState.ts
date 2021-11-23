/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import type { State, Maybe } from 'graphql-language-service';

// Utility for iterating through a CodeMirror parse state stack bottom-up.
export default function forEachState(stack: State, fn: (state: State) => void) {
  const reverseStateStack = [];
  let state: Maybe<State> = stack;
  while (state && state.kind) {
    reverseStateStack.push(state);
    state = state.prevState;
  }
  for (let i = reverseStateStack.length - 1; i >= 0; i--) {
    fn(reverseStateStack[i]);
  }
}
