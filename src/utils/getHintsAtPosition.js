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

import forEachState from './forEachState';
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
  var typeInfo = getTypeInfo(schema, token.state);
  var state = token.state;
  var kind = state.kind;
  var step = state.step;

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
      var fields;
      if (typeInfo.parentType.getFields) {
        var fieldObj = typeInfo.parentType.getFields();
        fields = objectValues(fieldObj);
      } else {
        fields = [];
      }
      if (isAbstractType(typeInfo.parentType)) {
        fields.push(TypeNameMetaFieldDef);
      }
      if (typeInfo.parentType === schema.getQueryType()) {
        fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
      }
      return hintList(cursor, token, fields.map(field => ({
        text: field.name,
        type: field.type,
        description: field.description
      })));
    }
  }

  // Argument names
  if (kind === 'Arguments' || kind === 'Argument' && step === 0) {
    var argDefs = typeInfo.argDefs;
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
      var objectFields = objectValues(typeInfo.objectFieldDefs);
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
    var namedInputType = getNamedType(typeInfo.inputType);
    if (namedInputType instanceof GraphQLEnumType) {
      var valueMap = namedInputType.getValues();
      var values = objectValues(valueMap);
      return hintList(cursor, token, values.map(value => ({
        text: value.name,
        type: namedInputType,
        description: value.description
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
    var possibleTypes;
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
    var inputTypeMap = schema.getTypeMap();
    var inputTypes = objectValues(inputTypeMap).filter(isInputType);
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
function getTypeInfo(schema, tokenState) {
  var info = {
    type: null,
    parentType: null,
    inputType: null,
    directiveDef: null,
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
        info.fieldDef = info.type && state.name ?
          getFieldDef(schema, info.parentType, state.name) :
          null;
        info.type = info.fieldDef && info.fieldDef.type;
        break;
      case 'SelectionSet':
        info.parentType = getNamedType(info.type);
        break;
      case 'Directive':
        info.directiveDef = state.name && schema.getDirective(state.name);
        break;
      case 'Arguments':
        info.argDefs =
          state.prevState.kind === 'Field' ?
            info.fieldDef && info.fieldDef.args :
          state.prevState.kind === 'Directive' ?
            info.directiveDef && info.directiveDef.args :
            null;
        break;
      case 'Argument':
        info.argDef = null;
        if (info.argDefs) {
          for (var i = 0; i < info.argDefs.length; i++) {
            if (info.argDefs[i].name === state.name) {
              info.argDef = info.argDefs[i];
              break;
            }
          }
        }
        info.inputType = info.argDef && info.argDef.type;
        break;
      case 'ListValue':
        var nullableType = getNullableType(info.inputType);
        info.inputType = nullableType instanceof GraphQLList ?
          nullableType.ofType :
          null;
        break;
      case 'ObjectValue':
        var objectType = getNamedType(info.inputType);
        info.objectFieldDefs = objectType instanceof GraphQLInputObjectType ?
          objectType.getFields() :
          null;
        break;
      case 'ObjectField':
        var objectField = state.name && info.objectFieldDefs ?
          info.objectFieldDefs[state.name] :
          null;
        info.inputType = objectField && objectField.type;
        break;
    }
  });

  return info;
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

// Gets the field definition given a type and field name
function getFieldDef(schema, type, fieldName) {
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === type) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if (type.getFields) {
    return type.getFields()[fieldName];
  }
}
