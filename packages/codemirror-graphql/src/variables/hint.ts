/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror, { Hints } from 'codemirror';
import {
  getNullableType,
  getNamedType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInputType,
  GraphQLInputFieldMap,
} from 'graphql';
import type { State, Maybe } from 'graphql-language-service';
import { IHints } from '../hint';

import forEachState from '../utils/forEachState';
import hintList from '../utils/hintList';

export type VariableToType = Record<string, GraphQLInputType>;
interface GraphQLVariableHintOptions {
  variableToType: VariableToType;
}

declare module 'codemirror' {
  interface ShowHintOptions {
    variableToType?: VariableToType;
  }

  interface CodeMirrorHintMap {
    'graphql-variables': (
      editor: CodeMirror.Editor,
      options: GraphQLVariableHintOptions,
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
 *   - variableToType: { [variable: string]: GraphQLInputType }
 *
 * Additional Events:
 *
 *   - hasCompletion (codemirror, data, token) - signaled when the hinter has a
 *     new list of completion suggestions.
 *
 */
CodeMirror.registerHelper(
  'hint',
  'graphql-variables',
  (
    editor: CodeMirror.Editor,
    options: GraphQLVariableHintOptions,
  ): Hints | undefined => {
    const cur = editor.getCursor();
    const token = editor.getTokenAt(cur);

    const results = getVariablesHint(cur, token, options);
    if (results?.list && results.list.length > 0) {
      results.from = CodeMirror.Pos(results.from.line, results.from.ch);
      results.to = CodeMirror.Pos(results.to.line, results.to.ch);
      CodeMirror.signal(editor, 'hasCompletion', editor, results, token);
    }

    return results;
  },
);

function getVariablesHint(
  cur: CodeMirror.Position,
  token: CodeMirror.Token,
  options: GraphQLVariableHintOptions,
) {
  // If currently parsing an invalid state, attempt to hint to the prior state.
  const state =
    token.state.kind === 'Invalid' ? token.state.prevState : token.state;

  const { kind, step } = state;
  // Variables can only be an object literal.
  if (kind === 'Document' && step === 0) {
    return hintList(cur, token, [{ text: '{' }]);
  }

  const { variableToType } = options;
  if (!variableToType) {
    return;
  }

  const typeInfo = getTypeInfo(variableToType, token.state);

  // Top level should typeahead possible variables.
  if (kind === 'Document' || (kind === 'Variable' && step === 0)) {
    const variableNames = Object.keys(variableToType);
    return hintList(
      cur,
      token,
      variableNames.map(name => ({
        text: `"${name}": `,
        type: variableToType[name],
      })),
    );
  }

  // Input Object fields
  if (
    (kind === 'ObjectValue' || (kind === 'ObjectField' && step === 0)) &&
    typeInfo.fields
  ) {
    const inputFields = Object.keys(typeInfo.fields).map(
      fieldName => typeInfo.fields![fieldName],
    );
    return hintList(
      cur,
      token,
      inputFields.map(field => ({
        text: `"${field.name}": `,
        type: field.type,
        description: field.description,
      })),
    );
  }

  // Input values.
  if (
    kind === 'StringValue' ||
    kind === 'NumberValue' ||
    kind === 'BooleanValue' ||
    kind === 'NullValue' ||
    (kind === 'ListValue' && step === 1) ||
    (kind === 'ObjectField' && step === 2) ||
    (kind === 'Variable' && step === 2)
  ) {
    const namedInputType = typeInfo.type
      ? getNamedType(typeInfo.type)
      : undefined;
    if (namedInputType instanceof GraphQLInputObjectType) {
      return hintList(cur, token, [{ text: '{' }]);
    }
    if (namedInputType instanceof GraphQLEnumType) {
      const values = namedInputType.getValues();
      // const values = Object.keys(valueMap).map(name => valueMap[name]); // TODO: Previously added
      return hintList(
        cur,
        token,
        values.map(value => ({
          text: `"${value.name}"`,
          type: namedInputType,
          description: value.description,
        })),
      );
    }
    if (namedInputType === GraphQLBoolean) {
      return hintList(cur, token, [
        { text: 'true', type: GraphQLBoolean, description: 'Not false.' }, // TODO: type and description don't seem to be used. Added them as optional anyway.
        { text: 'false', type: GraphQLBoolean, description: 'Not true.' },
      ]);
    }
  }
}

interface VariableTypeInfo {
  type?: Maybe<GraphQLInputType>;
  fields?: Maybe<GraphQLInputFieldMap>;
}

// Utility for collecting rich type information given any token's state
// from the graphql-variables-mode parser.
function getTypeInfo(
  variableToType: Record<string, GraphQLInputType>,
  tokenState: State,
) {
  const info: VariableTypeInfo = {
    type: null,
    fields: null,
  };

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Variable': {
        info.type = variableToType[state.name!];
        break;
      }
      case 'ListValue': {
        const nullableType = info.type ? getNullableType(info.type) : undefined;
        info.type =
          nullableType instanceof GraphQLList ? nullableType.ofType : null;
        break;
      }
      case 'ObjectValue': {
        const objectType = info.type ? getNamedType(info.type) : undefined;
        info.fields =
          objectType instanceof GraphQLInputObjectType
            ? objectType.getFields()
            : null;
        break;
      }
      case 'ObjectField': {
        const objectField =
          state.name && info.fields ? info.fields[state.name] : null;
        info.type = objectField?.type;
        break;
      }
    }
  });

  return info;
}
