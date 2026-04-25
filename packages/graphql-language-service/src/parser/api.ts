/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { IPosition } from '..';
import {
  CharacterStream,
  onlineParser,
  ContextToken,
  State,
  getTypeInfo,
} from '.';
import { BREAK, GraphQLSchema, Kind, parse, visit } from 'graphql';

export type ParserCallbackFn = (
  stream: CharacterStream,
  state: State,
  style: string,
  index: number,
) => void | 'BREAK';

/**
 * Provides an utility function to parse a given query text and construct a
 * `token` context object.
 * A token context provides useful information about the token/style that
 * CharacterStream currently possesses, as well as the end state and style
 * of the token.
 */
export function runOnlineParser(
  queryText: string,
  callback: ParserCallbackFn,
): ContextToken {
  const lines = queryText.split('\n');
  const parser = onlineParser();
  let state = parser.startState();
  let style = '';

  let stream: CharacterStream = new CharacterStream('');

  for (let i = 0; i < lines.length; i++) {
    stream = new CharacterStream(lines[i]);
    while (!stream.eol()) {
      style = parser.token(stream, state);
      const code = callback(stream, state, style, i);
      if (code === 'BREAK') {
        break;
      }
    }

    // Above while loop won't run if there is an empty line.
    // Run the callback one more time to catch this.
    callback(stream, state, style, i);

    if (!state.kind) {
      state = parser.startState();
    }
  }

  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    state,
    style,
  };
}

export enum GraphQLDocumentMode {
  TYPE_SYSTEM = 'TYPE_SYSTEM',
  EXECUTABLE = 'EXECUTABLE',
  UNKNOWN = 'UNKNOWN',
}

export const TYPE_SYSTEM_KINDS: Kind[] = [
  // TypeSystemDefinition
  Kind.SCHEMA_DEFINITION,
  Kind.OPERATION_TYPE_DEFINITION,
  Kind.SCALAR_TYPE_DEFINITION,
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
  Kind.UNION_TYPE_DEFINITION,
  Kind.ENUM_TYPE_DEFINITION,
  Kind.INPUT_OBJECT_TYPE_DEFINITION,
  Kind.DIRECTIVE_DEFINITION,
  // TypeSystemExtension
  Kind.SCHEMA_EXTENSION,
  Kind.SCALAR_TYPE_EXTENSION,
  Kind.OBJECT_TYPE_EXTENSION,
  Kind.INTERFACE_TYPE_EXTENSION,
  Kind.UNION_TYPE_EXTENSION,
  Kind.ENUM_TYPE_EXTENSION,
  Kind.INPUT_OBJECT_TYPE_EXTENSION,
];

const getParsedMode = (sdl: string | undefined): GraphQLDocumentMode => {
  let mode = GraphQLDocumentMode.UNKNOWN;
  if (sdl) {
    try {
      visit(parse(sdl), {
        enter(node) {
          if (node.kind === 'Document') {
            mode = GraphQLDocumentMode.EXECUTABLE;
            return;
          }
          if (TYPE_SYSTEM_KINDS.includes(node.kind)) {
            mode = GraphQLDocumentMode.TYPE_SYSTEM;
            return BREAK;
          }
          return false;
        },
      });
    } catch {
      return mode;
    }
  }
  return mode;
};

export function getDocumentMode(
  documentText: string,
  uri?: string,
): GraphQLDocumentMode {
  if (uri?.endsWith('.graphqls')) {
    return GraphQLDocumentMode.TYPE_SYSTEM;
  }
  return getParsedMode(documentText);
}

/**
 * Given a query text and a cursor position, return the context token
 */
export function getTokenAtPosition(
  queryText: string,
  cursor: IPosition,
  offset = 0,
): ContextToken {
  let styleAtCursor = null;
  let stateAtCursor = null;
  let stringAtCursor = null;
  const token = runOnlineParser(queryText, (stream, state, style, index) => {
    if (
      index !== cursor.line ||
      stream.getCurrentPosition() + offset < cursor.character + 1
    ) {
      return;
    }
    styleAtCursor = style;
    stateAtCursor = { ...state };
    stringAtCursor = stream.current();
    return 'BREAK';
  });

  // Return the state/style of parsed token in case those at cursor aren't
  // available.
  return {
    start: token.start,
    end: token.end,
    string: stringAtCursor || token.string,
    state: stateAtCursor || token.state,
    style: styleAtCursor || token.style,
  };
}

/**
 * Returns the token, state, typeInfo and mode at the cursor position
 * Used by getAutocompleteSuggestions
 */
export function getContextAtPosition(
  queryText: string,
  cursor: IPosition,
  schema: GraphQLSchema,
  contextToken?: ContextToken,
  options?: { mode?: GraphQLDocumentMode; uri?: string },
): {
  token: ContextToken;
  state: State;
  typeInfo: ReturnType<typeof getTypeInfo>;
  mode: GraphQLDocumentMode;
} | null {
  const token: ContextToken =
    contextToken || getTokenAtPosition(queryText, cursor, 1);
  if (!token) {
    return null;
  }

  const state =
    token.state.kind === 'Invalid' ? token.state.prevState : token.state;
  if (!state) {
    return null;
  }

  // relieve flow errors by checking if `state` exists

  const typeInfo = getTypeInfo(schema, token.state);
  const mode = options?.mode || getDocumentMode(queryText, options?.uri);
  return {
    token,
    state,
    typeInfo,
    mode,
  };
}
