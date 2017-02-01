/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {
  GraphQLDirective,
  GraphQLSchema,
} from 'graphql/type/definition';
import type {ASTNode} from 'graphql/language';
import type {
  CompletionItem,
  ContextToken,
  State,
  TypeInfo,
} from '../types/Types';
import type {Position} from '../utils/Range';

import {
  isInputType,
  isCompositeType,
  isAbstractType,
  getNullableType,
  getNamedType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
  doTypesOverlap,
} from 'graphql';
import {
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from 'graphql/type/introspection';
import {
  forEachState,
  getDefinitionState,
  getFieldDef,
  hintList,
  objectValues,
} from './autocompleteUtils';
import CharacterStream from '../parser/CharacterStream';
import onlineParser from '../parser/onlineParser';

/**
 * Given GraphQLSchema, queryText, and context of the current position within
 * the source text, provide a list of typeahead entries.
 */

export function getAutocompleteSuggestions(
  schema: GraphQLSchema,
  queryText: string,
  cursor: Position,
): Array<CompletionItem> {
  const token = getTokenAtPosition(queryText, cursor);

  const state = token.state.kind === 'Invalid' ?
    token.state.prevState :
    token.state;

  // relieve flow errors by checking if `state` exists
  if (!state) {
    return [];
  }

  const kind = state.kind;
  const step = state.step;
  const typeInfo = getTypeInfo(schema, token.state);

  // Definition kinds
  if (kind === 'Document') {
    return hintList(token, [
      {label: 'query'},
      {label: 'mutation'},
      {label: 'subscription'},
      {label: 'fragment'},
      {label: '{'},
    ]);
  }

  // Field names
  if (kind === 'SelectionSet' || kind === 'Field' || kind === 'AliasedField') {
    return getSuggestionsForFieldNames(
      token,
      typeInfo,
      schema,
    );
  }

  // Argument names
  if (kind === 'Arguments' || kind === 'Argument' && step === 0) {
    const argDefs = typeInfo.argDefs;
    if (argDefs) {
      return hintList(token, argDefs.map(argDef => ({
        label: argDef.name,
        detail: argDef.type,
        documentation: argDef.description,
      })));
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || kind === 'ObjectField' && step === 0) {
    if (typeInfo.objectFieldDefs) {
      const objectFields = objectValues(typeInfo.objectFieldDefs);
      return hintList(token, objectFields.map(field => ({
        label: field.name,
        detail: field.type,
        documentation: field.description,
      })));
    }
  }

  // Input values: Enum and Boolean
  if (
    kind === 'EnumValue' ||
    kind === 'ListValue' && step === 1 ||
    kind === 'ObjectField' && step === 2 ||
    kind === 'Argument' && step === 2
  ) {
    return getSuggestionsForInputValues(token, typeInfo);
  }

  // Fragment type conditions
  if (
    kind === 'TypeCondition' && step === 1 ||
    kind === 'NamedType' && state.prevState != null &&
    state.prevState.kind === 'TypeCondition'
  ) {
    return getSuggestionsForFragmentTypeConditions(
      token,
      typeInfo,
      schema,
    );
  }

  // Fragment spread names
  if (kind === 'FragmentSpread' && step === 1) {
    return getSuggestionsForFragmentSpread(
      token,
      typeInfo,
      schema,
      queryText,
    );
  }

  // Variable definition types
  if (
    kind === 'VariableDefinition' && step === 2 ||
    kind === 'ListType' && step === 1 ||
    kind === 'NamedType' && state.prevState && (
      state.prevState.kind === 'VariableDefinition' ||
      state.prevState.kind === 'ListType'
    )
  ) {
    return getSuggestionsForVariableDefinition(token, schema);
  }

  // Directive names
  if (kind === 'Directive') {
    return getSuggestionsForDirective(token, state, schema);
  }

  return [];
}

// Helper functions to get suggestions for each kinds
function getSuggestionsForFieldNames(
  token: ContextToken,
  typeInfo: TypeInfo,
  schema: GraphQLSchema,
): Array<CompletionItem> {
  if (typeInfo.parentType) {
    const parentType = typeInfo.parentType;
    const fields = parentType.getFields ?
      objectValues(parentType.getFields()) :
      [];
    if (isAbstractType(parentType)) {
      fields.push(TypeNameMetaFieldDef);
    }
    if (parentType === schema.getQueryType()) {
      fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
    }
    return hintList(token, fields.map(field => ({
      label: field.name,
      detail: field.type,
      documentation: field.description,
      isDeprecated: field.isDeprecated,
      deprecationReason: field.deprecationReason,
    })));
  }
  return [];
}

function getSuggestionsForInputValues(
  token: ContextToken,
  typeInfo: TypeInfo,
): Array<CompletionItem> {
  const namedInputType = getNamedType(typeInfo.inputType);
  if (namedInputType instanceof GraphQLEnumType) {
    const valueMap = namedInputType.getValues();
    const values = objectValues(valueMap);
    return hintList(token, values.map(value => ({
      label: value.name,
      detail: namedInputType,
      documentation: value.description,
      isDeprecated: value.isDeprecated,
      deprecationReason: value.deprecationReason,
    })));
  } else if (namedInputType === GraphQLBoolean) {
    return hintList(token, [
      {label: 'true', detail: GraphQLBoolean, documentation: 'Not false.'},
      {label: 'false', detail: GraphQLBoolean, documentation: 'Not true.'},
    ]);
  }

  return [];
}

function getSuggestionsForFragmentTypeConditions(
  token: ContextToken,
  typeInfo: TypeInfo,
  schema: GraphQLSchema,
): Array<CompletionItem> {
  let possibleTypes;
  if (typeInfo.parentType) {
    if (isAbstractType(typeInfo.parentType)) {
      // Collect both the possible Object types as well as the interfaces
      // they implement.
      const possibleObjTypes = schema.getPossibleTypes(typeInfo.parentType);
      const possibleIfaceMap = Object.create(null);
      possibleObjTypes.forEach(type => {
        type.getInterfaces().forEach(iface => {
          possibleIfaceMap[iface.name] = iface;
        });
      });
      possibleTypes = possibleObjTypes.concat(objectValues(possibleIfaceMap));
    } else {
      // The parent type is a non-abstract Object type, so the only possible
      // type that can be used is that same type.
      possibleTypes = [typeInfo.parentType];
    }
  } else {
    const typeMap = schema.getTypeMap();
    possibleTypes = objectValues(typeMap).filter(isCompositeType);
  }
  return hintList(token, possibleTypes.map(type => ({
    label: type.name,
    documentation: type.description,
  })));
}

function getSuggestionsForFragmentSpread(
  token: ContextToken,
  typeInfo: TypeInfo,
  schema: GraphQLSchema,
  queryText: string,
): Array<CompletionItem> {
  const typeMap = schema.getTypeMap();
  const defState = getDefinitionState(token.state);
  const fragments = getFragmentDefinitions(queryText);

  // Filter down to only the fragments which may exist here.
  const relevantFrags = fragments.filter(frag =>
    // Only include fragments with known types.
    typeMap[frag.typeCondition.name.value] &&
    // Only include fragments which are not cyclic.
    !(defState &&
      defState.kind === 'FragmentDefinition' &&
      defState.name === frag.name.value) &&
    // Only include fragments which could possibly be spread here.
    doTypesOverlap(
      schema,
      typeInfo.parentType,
      typeMap[frag.typeCondition.name.value],
    ),
  );

  return hintList(token, relevantFrags.map(frag => ({
    label: frag.name.value,
    detail: typeMap[frag.typeCondition.name.value],
    documentation:
      `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`,
  })));
}

function getFragmentDefinitions(queryText: string): Array<ASTNode> {
  const fragmentDefs = [];
  runOnlineParser(queryText, (_, state) => {
    if (state.kind === 'FragmentDefinition' && state.name && state.type) {
      fragmentDefs.push({
        kind: 'FragmentDefinition',
        name: {
          kind: 'Name',
          value: state.name,
        },
        typeCondition: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: state.type,
          },
        },
      });
    }
  });

  return fragmentDefs;
}

function getSuggestionsForVariableDefinition(
  token: ContextToken,
  schema: GraphQLSchema,
): Array<CompletionItem> {
  const inputTypeMap = schema.getTypeMap();
  const inputTypes = objectValues(inputTypeMap).filter(isInputType);
  return hintList(token, inputTypes.map(type => ({
    label: type.name,
    documentation: type.description,
  })));
}

function getSuggestionsForDirective(
  token: ContextToken,
  state: State,
  schema: GraphQLSchema,
): Array<CompletionItem> {
  if (state.prevState && state.prevState.kind) {
    const stateKind = state.prevState.kind;
    const directives = schema.getDirectives().filter(
      directive => canUseDirective(stateKind, directive),
    );
    return hintList(token, directives.map(directive => ({
      label: directive.name,
      documentation: directive.description,
    })));
  }
  return [];
}

function getTokenAtPosition(queryText: string, cursor: Position): ContextToken {
  let styleAtCursor = null;
  let stateAtCursor = null;
  let stringAtCursor = null;
  const token = runOnlineParser(queryText, (stream, state, style, index) => {
    if (index === cursor.line) {
      if (stream.getCurrentPosition() > cursor.character) {
        return 'BREAK';
      }
      styleAtCursor = style;
      stateAtCursor = {...state};
      stringAtCursor = stream.current();
    }
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
 * Provides an utility function to parse a given query text and construct a
 * `token` context object.
 * A token context provides useful information about the token/style that
 * CharacterStream currently possesses, as well as the end state and style
 * of the token.
 */
type callbackFnType = (
  stream: CharacterStream,
  state: State,
  style: string,
  index: number,
) => void | 'BREAK';

function runOnlineParser(
  queryText: string,
  callback: callbackFnType,
): ContextToken {
  const lines = queryText.split('\n');
  const parser = onlineParser();
  let state = parser.startState();
  let style = '';

  let stream: CharacterStream = new CharacterStream('');

  for (let i = 0; i < lines.length; i++) {
    stream = new CharacterStream(lines[i]);
    // Stop the parsing when the stream arrives at the current cursor position
    while (!stream.eol()) {
      style = parser.token(stream, state);
      const code = callback(stream, state, style, i);
      if (code === 'BREAK') {
        break;
      }
    }

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

function canUseDirective(kind: string, directive: GraphQLDirective): boolean {
  const locations = directive.locations;
  switch (kind) {
    case 'Query':
      return locations.indexOf('QUERY') !== -1;
    case 'Mutation':
      return locations.indexOf('MUTATION') !== -1;
    case 'Subscription':
      return locations.indexOf('SUBSCRIPTION') !== -1;
    case 'Field':
    case 'AliasedField':
      return locations.indexOf('FIELD') !== -1;
    case 'FragmentDefinition':
      return locations.indexOf('FRAGMENT_DEFINITION') !== -1;
    case 'FragmentSpread':
      return locations.indexOf('FRAGMENT_SPREAD') !== -1;
    case 'InlineFragment':
      return locations.indexOf('INLINE_FRAGMENT') !== -1;
  }
  return false;
}

// Utility for collecting rich type information given any token's state
// from the graphql-mode parser.
function getTypeInfo(schema: GraphQLSchema, tokenState: State): TypeInfo {
  const info = {
    schema,
    type: null,
    parentType: null,
    inputType: null,
    directiveDef: null,
    enumValue: null,
    fieldDef: null,
    argDef: null,
    argDefs: null,
    objectFieldDefs: null,
  };

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
        info.type = schema.getQueryType();
        break;
      case 'Mutation':
        info.type = schema.getMutationType();
        break;
      case 'Subscription':
        info.type = schema.getSubscriptionType();
        break;
      case 'InlineFragment':
      case 'FragmentDefinition':
        if (state.type) {
          info.type = schema.getType(state.type);
        }
        break;
      case 'Field':
      case 'AliasedField':
        if (!info.type || !state.name) {
          info.fieldDef = null;
        } else {
          info.fieldDef = getFieldDef(schema, info.parentType, state.name);
          info.type = info.fieldDef ? info.fieldDef.type : null;
        }
        break;
      case 'SelectionSet':
        info.parentType = getNamedType(info.type);
        break;
      case 'Directive':
        info.directiveDef = state.name ? schema.getDirective(state.name) : null;
        break;
      case 'Arguments':
        if (!state.prevState) {
          info.argDefs = null;
        } else {
          switch (state.prevState.kind) {
            case 'Field':
              info.argDefs = info.fieldDef && info.fieldDef.args;
              break;
            case 'Directive':
              info.argDefs = info.directiveDef && info.directiveDef.args;
              break;
            case 'AliasedField':
              const name = state.prevState && state.prevState.name;
              if (!name) {
                info.argDefs = null;
                break;
              }
              const fieldDef = getFieldDef(
                schema,
                info.parentType,
                name,
              );
              if (!fieldDef) {
                info.argDefs = null;
                break;
              }
              info.argDefs = fieldDef.args;
              break;
            default:
              info.argDefs = null;
              break;
          }
        }
        break;
      case 'Argument':
        info.argDef = null;
        if (info.argDefs) {
          for (let i = 0; i < info.argDefs.length; i++) {
            if (info.argDefs[i].name === state.name) {
              info.argDef = info.argDefs[i];
              break;
            }
          }
        }
        info.inputType = info.argDef && info.argDef.type;
        break;
      case 'EnumValue':
        const enumType = getNamedType(info.inputType);
        info.enumValue = enumType instanceof GraphQLEnumType ?
          find(enumType.getValues(), val => val.value === state.name) :
          null;
        break;
      case 'ListValue':
        const nullableType = getNullableType(info.inputType);
        info.inputType = nullableType instanceof GraphQLList ?
          nullableType.ofType :
          null;
        break;
      case 'ObjectValue':
        const objectType = getNamedType(info.inputType);
        info.objectFieldDefs = objectType instanceof GraphQLInputObjectType ?
          objectType.getFields() :
          null;
        break;
      case 'ObjectField':
        const objectField = state.name && info.objectFieldDefs ?
          info.objectFieldDefs[state.name] :
          null;
        info.inputType = objectField && objectField.type;
        break;
      case 'NamedType':
        info.type = schema.getType(state.name);
        break;
    }
  });

  return info;
}

// Returns the first item in the array which causes predicate to return truthy.
function find(array, predicate) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
  return null;
}
