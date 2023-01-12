/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 *
 */

import CodeMirror, { Hints, Hint } from 'codemirror';
import 'codemirror/addon/hint/show-hint';

import { FragmentDefinitionNode, GraphQLSchema, GraphQLType } from 'graphql';
import type { Maybe } from 'graphql-language-service';
import { getAutocompleteSuggestions, Position } from 'graphql-language-service';

export interface GraphQLHintOptions {
  schema?: GraphQLSchema;
  externalFragments?: string | FragmentDefinitionNode[];
}

interface IHint extends Hint {
  isDeprecated?: boolean;
  type?: Maybe<GraphQLType>;
  description?: Maybe<string>;
  deprecationReason?: Maybe<string>;
}

interface IHints extends Hints {
  list: IHint[];
}

declare module 'codemirror' {
  interface ShowHintOptions {
    schema?: GraphQLSchema;
    externalFragments?: string | FragmentDefinitionNode[];
  }

  interface CodeMirrorHintMap {
    graphql: (
      editor: CodeMirror.Editor,
      options: GraphQLHintOptions,
    ) => IHints | undefined;
  }
}

/**
 * Registers a "hint" helper for CodeMirror.
 *
 * Using CodeMirror's "hint" addon: https://codemirror.net/demo/complete.html
 * Given an editor, this helper will take the token at the cursor and return a
 * list of suggested tokens.
 *
 * Options:
 *
 *   - schema: GraphQLSchema provides the hinter with positionally relevant info
 *
 * Additional Events:
 *
 *   - hasCompletion (codemirror, data, token) - signaled when the hinter has a
 *     new list of completion suggestions.
 *
 */
CodeMirror.registerHelper(
  'hint',
  'graphql',
  (
    editor: CodeMirror.Editor,
    options: GraphQLHintOptions,
  ): IHints | undefined => {
    const { schema, externalFragments } = options;
    if (!schema) {
      return;
    }

    const cur = editor.getCursor();
    const token = editor.getTokenAt(cur);

    const tokenStart =
      token.type !== null && /"|\w/.test(token.string[0])
        ? token.start
        : token.end;

    const position = new Position(cur.line, tokenStart);

    const rawResults = getAutocompleteSuggestions(
      schema,
      editor.getValue(),
      position,
      token,
      externalFragments,
    );

    const results = {
      list: rawResults.map(item => ({
        text: item.label,
        type: item.type,
        description: item.documentation,
        isDeprecated: item.isDeprecated,
        deprecationReason: item.deprecationReason,
      })),
      from: { line: cur.line, ch: tokenStart },
      to: { line: cur.line, ch: token.end },
    };

    if (results?.list && results.list.length > 0) {
      results.from = CodeMirror.Pos(results.from.line, results.from.ch);
      results.to = CodeMirror.Pos(results.to.line, results.to.ch);
      CodeMirror.signal(editor, 'hasCompletion', editor, results, token);
    }

    return results;
  },
);
// exporting here so we don't need to import the codemirror show-hint addon module (and its implementation)
export type { IHint, IHints };
