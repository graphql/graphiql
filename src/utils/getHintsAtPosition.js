/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  isInputType,
  isCompositeType,
  isAbstractType,
  getNamedType,
  GraphQLEnumType,
  GraphQLBoolean,
  doTypesOverlap,
} from 'graphql';
import {
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from 'graphql/type/introspection';

import forEachState from './forEachState';
import getTypeInfo from './getTypeInfo';
import hintList from './hintList';
import objectValues from './objectValues';

import runParser from './runParser';
import { LexRules, ParseRules, isIgnored } from './Rules';

/**
 * Given GraphQLSchema, sourceText, and context of the current position within
 * the source text, provide a list of typeahead entries.
 *
 * Options:
 *   - schema: GraphQLSchema
 *   - sourceText: string. A raw source text used to get fragmentDefinitions
 *                 in a source.
 *   - cursor: { line: Number, column: Number }. A current cursor position.
 *   - token: ContextToken. Includes a context for the current cursor position.
 *     Includes the token string/style (type), the start/end position, and the
 *     state at the end of the token.
 *
 */

export default function getHintsAtPosition(schema, sourceText, cursor, token) {
  const typeInfo = getTypeInfo(schema, token.state);
  const state = token.state;
  const kind = state.kind;
  const step = state.step;

  if (token.type === 'comment') {
    return;
  }

  // Definition kinds
  if (kind === 'Document') {
    return hintList(cursor, token, [
      { text: 'query' },
      { text: 'mutation' },
      { text: 'subscription' },
      { text: 'fragment' },
      { text: '{' },
    ]);
  }

  // Field names
  if (kind === 'SelectionSet' || kind === 'Field' || kind === 'AliasedField') {
    if (typeInfo.parentType) {
      const fields = typeInfo.parentType.getFields ?
        objectValues(typeInfo.parentType.getFields()) :
        [];
      if (isAbstractType(typeInfo.parentType)) {
        fields.push(TypeNameMetaFieldDef);
      }
      if (typeInfo.parentType === schema.getQueryType()) {
        fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
      }
      return hintList(cursor, token, fields.map(field => ({
        text: field.name,
        type: field.type,
        description: field.description,
        isDeprecated: value.isDeprecated,
        deprecationReason: value.deprecationReason,
      })));
    }
  }

  // Argument names
  if (kind === 'Arguments' || kind === 'Argument' && step === 0) {
    const argDefs = typeInfo.argDefs;
    if (argDefs) {
      return hintList(cursor, token, argDefs.map(argDef => ({
        text: argDef.name,
        type: argDef.type,
        description: argDef.description
      })));
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || kind === 'ObjectField' && step === 0) {
    if (typeInfo.objectFieldDefs) {
      const objectFields = objectValues(typeInfo.objectFieldDefs);
      return hintList(cursor, token, objectFields.map(field => ({
        text: field.name,
        type: field.type,
        description: field.description
      })));
    }
  }

  // Input values: Enum and Boolean
  if (kind === 'EnumValue' ||
      kind === 'ListValue' && step === 1 ||
      kind === 'ObjectField' && step === 2 ||
      kind === 'Argument' && step === 2) {
    const namedInputType = getNamedType(typeInfo.inputType);
    if (namedInputType instanceof GraphQLEnumType) {
      const valueMap = namedInputType.getValues();
      const values = objectValues(valueMap);
      return hintList(cursor, token, values.map(value => ({
        text: value.name,
        type: namedInputType,
        description: value.description,
        isDeprecated: value.isDeprecated,
        deprecationReason: value.deprecationReason,
      })));
    } else if (namedInputType === GraphQLBoolean) {
      return hintList(cursor, token, [
        { text: 'true', type: GraphQLBoolean, description: 'Not false.' },
        { text: 'false', type: GraphQLBoolean, description: 'Not true.' },
      ]);
    }
  }

  // Fragment type conditions
  if (kind === 'TypeCondition' && step === 1 ||
      kind === 'NamedType' && state.prevState.kind === 'TypeCondition') {
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
        possibleTypes = [ typeInfo.parentType ];
      }
    } else {
      const typeMap = schema.getTypeMap();
      possibleTypes = objectValues(typeMap).filter(isCompositeType);
    }
    return hintList(cursor, token, possibleTypes.map(type => ({
      text: type.name,
      description: type.description
    })));
  }

  // Fragment spread names
  if (kind === 'FragmentSpread' && step === 1) {
    const typeMap = schema.getTypeMap();
    const defState = getDefinitionState(token.state);
    const fragments = getFragmentDefinitions(sourceText);

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
        typeMap[frag.typeCondition.name.value]
      )
    );

    return hintList(cursor, token, relevantFrags.map(frag => ({
      text: frag.name.value,
      type: typeMap[frag.typeCondition.name.value],
      description:
        `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`
    })));
  }

  // Variable definition types
  if (kind === 'VariableDefinition' && step === 2 ||
      kind === 'ListType' && step === 1 ||
      kind === 'NamedType' && (
        state.prevState.kind === 'VariableDefinition' ||
        state.prevState.kind === 'ListType')) {
    const inputTypeMap = schema.getTypeMap();
    const inputTypes = objectValues(inputTypeMap).filter(isInputType);
    return hintList(cursor, token, inputTypes.map(type => ({
      text: type.name,
      description: type.description
    })));
  }

  // Directive names
  if (kind === 'Directive') {
    const directives = schema.getDirectives().filter(
      directive => canUseDirective(state.prevState.kind, directive)
    );
    return hintList(cursor, token, directives.map(directive => ({
      text: directive.name,
      description: directive.description
    })));
  }
}

function canUseDirective(kind, directive) {
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


// Finds all fragment definition ASTs in a source.
function getFragmentDefinitions(sourceText) {
  const fragmentDefs = [];
  runParser(sourceText, {
    eatWhitespace: stream => stream.eatWhile(isIgnored),
    LexRules,
    ParseRules
  }, (stream, state) => {
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
          }
        }
      });
    }
  });

  return fragmentDefs;
}

// Utility for returning the state representing the Definition this token state
// is within, if any.
function getDefinitionState(tokenState) {
  let definitionState;

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
      case 'Mutation':
      case 'Subscription':
      case 'FragmentDefinition':
        definitionState = state;
        break;
    }
  });

  return definitionState;
}
