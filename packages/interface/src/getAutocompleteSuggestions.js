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
  FragmentDefinitionNode,
  GraphQLDirective,
  GraphQLSchema,
} from 'graphql';
import type {
  CompletionItem,
  ContextToken,
  State,
  TypeInfo,
} from 'graphql-language-service-types';
import type {Position} from 'graphql-language-service-utils';

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  assertAbstractType,
  doTypesOverlap,
  getNamedType,
  getNullableType,
  isAbstractType,
  isCompositeType,
  isInputType,
} from 'graphql';
import {CharacterStream, onlineParser} from 'graphql-language-service-parser';
import {
  forEachState,
  getDefinitionState,
  getFieldDef,
  hintList,
  objectValues,
} from './autocompleteUtils';

/**
 * Given GraphQLSchema, queryText, and context of the current position within
 * the source text, provide a list of typeahead entries.
 */
export function getAutocompleteSuggestions(
  schema: GraphQLSchema,
  queryText: string,
  cursor: Position,
  contextToken?: ContextToken,
): Array<CompletionItem> {
  const token = contextToken || getTokenAtPosition(queryText, cursor);

  const state =
    token.state.kind === 'Invalid' ? token.state.prevState : token.state;

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
    return getSuggestionsForFieldNames(token, typeInfo, schema);
  }

  // Argument names
  if (kind === 'Arguments' || (kind === 'Argument' && step === 0)) {
    const argDefs = typeInfo.argDefs;
    if (argDefs) {
      return hintList(
        token,
        argDefs.map(argDef => ({
          label: argDef.name,
          detail: String(argDef.type),
          documentation: argDef.description,
        })),
      );
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || (kind === 'ObjectField' && step === 0)) {
    if (typeInfo.objectFieldDefs) {
      const objectFields = objectValues(typeInfo.objectFieldDefs);
      return hintList(
        token,
        objectFields.map(field => ({
          label: field.name,
          detail: String(field.type),
          documentation: field.description,
        })),
      );
    }
  }

  // Input values: Enum and Boolean
  if (
    kind === 'EnumValue' ||
    (kind === 'ListValue' && step === 1) ||
    (kind === 'ObjectField' && step === 2) ||
    (kind === 'Argument' && step === 2)
  ) {
    return getSuggestionsForInputValues(token, typeInfo);
  }

  // Fragment type conditions
  if (
    (kind === 'TypeCondition' && step === 1) ||
    (kind === 'NamedType' &&
      state.prevState != null &&
      state.prevState.kind === 'TypeCondition')
  ) {
    return getSuggestionsForFragmentTypeConditions(token, typeInfo, schema);
  }

  // Fragment spread names
  if (kind === 'FragmentSpread' && step === 1) {
    return getSuggestionsForFragmentSpread(token, typeInfo, schema, queryText);
  }

  // Variable definition types
  if (
    (kind === 'VariableDefinition' && step === 2) ||
    (kind === 'ListType' && step === 1) ||
    (kind === 'NamedType' &&
      state.prevState &&
      (state.prevState.kind === 'VariableDefinition' ||
        state.prevState.kind === 'ListType'))
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
    const fields =
      parentType.getFields instanceof Function
        ? objectValues(parentType.getFields())
        : [];
    if (isAbstractType(parentType)) {
      fields.push(TypeNameMetaFieldDef);
    }
    if (parentType === schema.getQueryType()) {
      fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
    }
    return hintList(
      token,
      fields.map(field => ({
        label: field.name,
        detail: String(field.type),
        documentation: field.description,
        isDeprecated: field.isDeprecated,
        deprecationReason: field.deprecationReason,
      })),
    );
  }
  return [];
}

function getSuggestionsForInputValues(
  token: ContextToken,
  typeInfo: TypeInfo,
): Array<CompletionItem> {
  const namedInputType = getNamedType(typeInfo.inputType);
  if (namedInputType instanceof GraphQLEnumType) {
    const values = namedInputType.getValues();
    return hintList(
      token,
      values.map(value => ({
        label: value.name,
        detail: String(namedInputType),
        documentation: value.description,
        isDeprecated: value.isDeprecated,
        deprecationReason: value.deprecationReason,
      })),
    );
  } else if (namedInputType === GraphQLBoolean) {
    return hintList(token, [
      {
        label: 'true',
        detail: String(GraphQLBoolean),
        documentation: 'Not false.',
      },
      {
        label: 'false',
        detail: String(GraphQLBoolean),
        documentation: 'Not true.',
      },
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
      const abstractType = assertAbstractType(typeInfo.parentType);
      // Collect both the possible Object types as well as the interfaces
      // they implement.
      const possibleObjTypes = schema.getPossibleTypes(abstractType);
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
  return hintList(
    token,
    possibleTypes.map(type => {
      const namedType = getNamedType(type);
      return {
        label: String(type),
        documentation: (namedType && namedType.description) || '',
      };
    }),
  );
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
  const relevantFrags = fragments.filter(
    frag =>
      // Only include fragments with known types.
      typeMap[frag.typeCondition.name.value] &&
      // Only include fragments which are not cyclic.
      !(
        defState &&
        defState.kind === 'FragmentDefinition' &&
        defState.name === frag.name.value
      ) &&
      // Only include fragments which could possibly be spread here.
      isCompositeType(typeInfo.parentType) &&
      isCompositeType(typeMap[frag.typeCondition.name.value]) &&
      doTypesOverlap(
        schema,
        typeInfo.parentType,
        typeMap[frag.typeCondition.name.value],
      ),
  );

  return hintList(
    token,
    relevantFrags.map(frag => ({
      label: frag.name.value,
      detail: String(typeMap[frag.typeCondition.name.value]),
      documentation: `fragment ${frag.name.value} on ${frag.typeCondition.name
        .value}`,
    })),
  );
}

function getFragmentDefinitions(
  queryText: string,
): Array<FragmentDefinitionNode> {
  const fragmentDefs = [];
  runOnlineParser(queryText, (_, state) => {
    if (state.kind === 'FragmentDefinition' && state.name && state.type) {
      fragmentDefs.push({
        kind: 'FragmentDefinition',
        name: {
          kind: 'Name',
          value: state.name,
        },
        selectionSet: {
          kind: 'SelectionSet',
          selections: [],
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
  return hintList(
    token,
    inputTypes.map(type => ({
      label: type.name,
      documentation: type.description,
    })),
  );
}

function getSuggestionsForDirective(
  token: ContextToken,
  state: State,
  schema: GraphQLSchema,
): Array<CompletionItem> {
  if (state.prevState && state.prevState.kind) {
    const directives = schema
      .getDirectives()
      .filter(directive => canUseDirective(state.prevState, directive));
    return hintList(
      token,
      directives.map(directive => ({
        label: directive.name,
        documentation: directive.description || '',
      })),
    );
  }
  return [];
}

function getTokenAtPosition(queryText: string, cursor: Position): ContextToken {
  let styleAtCursor = null;
  let stateAtCursor = null;
  let stringAtCursor = null;
  const token = runOnlineParser(queryText, (stream, state, style, index) => {
    if (index === cursor.line) {
      if (stream.getCurrentPosition() >= cursor.character) {
        styleAtCursor = style;
        stateAtCursor = {...state};
        stringAtCursor = stream.current();
        return 'BREAK';
      }
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

function canUseDirective(
  state: $PropertyType<State, 'prevState'>,
  directive: GraphQLDirective,
): boolean {
  if (!state || !state.kind) {
    return false;
  }
  const kind = state.kind;
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

    // Schema Definitions
    case 'SchemaDef':
      return locations.indexOf('SCHEMA') !== -1;
    case 'ScalarDef':
      return locations.indexOf('SCALAR') !== -1;
    case 'ObjectTypeDef':
      return locations.indexOf('OBJECT') !== -1;
    case 'FieldDef':
      return locations.indexOf('FIELD_DEFINITION') !== -1;
    case 'InterfaceDef':
      return locations.indexOf('INTERFACE') !== -1;
    case 'UnionDef':
      return locations.indexOf('UNION') !== -1;
    case 'EnumDef':
      return locations.indexOf('ENUM') !== -1;
    case 'EnumValue':
      return locations.indexOf('ENUM_VALUE') !== -1;
    case 'InputDef':
      return locations.indexOf('INPUT_OBJECT') !== -1;
    case 'InputValueDef':
      const prevStateKind = state.prevState && state.prevState.kind;
      switch (prevStateKind) {
        case 'ArgumentsDef':
          return locations.indexOf('ARGUMENT_DEFINITION') !== -1;
        case 'InputDef':
          return locations.indexOf('INPUT_FIELD_DEFINITION') !== -1;
      }
  }
  return false;
}

// Utility for collecting rich type information given any token's state
// from the graphql-mode parser.
function getTypeInfo(schema: GraphQLSchema, tokenState: State): TypeInfo {
  let argDef;
  let argDefs;
  let directiveDef;
  let enumValue;
  let fieldDef;
  let inputType;
  let objectFieldDefs;
  let parentType;
  let type;

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
        type = schema.getQueryType();
        break;
      case 'Mutation':
        type = schema.getMutationType();
        break;
      case 'Subscription':
        type = schema.getSubscriptionType();
        break;
      case 'InlineFragment':
      case 'FragmentDefinition':
        if (state.type) {
          type = schema.getType(state.type);
        }
        break;
      case 'Field':
      case 'AliasedField':
        if (!type || !state.name) {
          fieldDef = null;
        } else {
          fieldDef = parentType
            ? getFieldDef(schema, parentType, state.name)
            : null;
          type = fieldDef ? fieldDef.type : null;
        }
        break;
      case 'SelectionSet':
        parentType = getNamedType(type);
        break;
      case 'Directive':
        directiveDef = state.name ? schema.getDirective(state.name) : null;
        break;
      case 'Arguments':
        if (!state.prevState) {
          argDefs = null;
        } else {
          switch (state.prevState.kind) {
            case 'Field':
              argDefs = fieldDef && fieldDef.args;
              break;
            case 'Directive':
              argDefs = directiveDef && directiveDef.args;
              break;
            case 'AliasedField':
              const name = state.prevState && state.prevState.name;
              if (!name) {
                argDefs = null;
                break;
              }
              const field = parentType
                ? getFieldDef(schema, parentType, name)
                : null;
              if (!field) {
                argDefs = null;
                break;
              }
              argDefs = field.args;
              break;
            default:
              argDefs = null;
              break;
          }
        }
        break;
      case 'Argument':
        if (argDefs) {
          for (let i = 0; i < argDefs.length; i++) {
            if (argDefs[i].name === state.name) {
              argDef = argDefs[i];
              break;
            }
          }
        }
        inputType = argDef && argDef.type;
        break;
      case 'EnumValue':
        const enumType = getNamedType(inputType);
        enumValue =
          enumType instanceof GraphQLEnumType
            ? find(enumType.getValues(), val => val.value === state.name)
            : null;
        break;
      case 'ListValue':
        const nullableType = getNullableType(inputType);
        inputType =
          nullableType instanceof GraphQLList ? nullableType.ofType : null;
        break;
      case 'ObjectValue':
        const objectType = getNamedType(inputType);
        objectFieldDefs =
          objectType instanceof GraphQLInputObjectType
            ? objectType.getFields()
            : null;
        break;
      case 'ObjectField':
        const objectField =
          state.name && objectFieldDefs ? objectFieldDefs[state.name] : null;
        inputType = objectField && objectField.type;
        break;
      case 'NamedType':
        if (state.name) {
          type = schema.getType(state.name);
        }
        break;
    }
  });

  return {
    argDef,
    argDefs,
    directiveDef,
    enumValue,
    fieldDef,
    inputType,
    objectFieldDefs,
    parentType,
    type,
  };
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
