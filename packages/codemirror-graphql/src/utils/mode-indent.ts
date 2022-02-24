/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import { State } from 'graphql-language-service';

// Seems the electricInput type in @types/codemirror is wrong (i.e it is written as electricinput instead of electricInput)
export default function indent(
  this: CodeMirror.Mode<any> & {
    electricInput?: RegExp;
    config?: CodeMirror.EditorConfiguration;
  },
  state: State,
  textAfter: string,
) {
  const levels = state.levels;
  // If there is no stack of levels, use the current level.
  // Otherwise, use the top level, pre-emptively dedenting for close braces.
  const level =
    !levels || levels.length === 0
      ? state.indentLevel
      : levels[levels.length - 1] -
        (this.electricInput?.test(textAfter) ? 1 : 0);
  return (level || 0) * (this.config?.indentUnit || 0);
}
