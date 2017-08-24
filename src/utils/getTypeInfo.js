/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  isCompositeType,
  getNullableType,
  getNamedType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import {
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from 'graphql/type/introspection';

import forEachState from './forEachState';

/**
 * Utility for collecting rich type information given any token's state
 * from the graphql-mode parser.
 */
export default function getTypeInfo(schema, tokenState) {
  const info = {
    schema,
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
      case 'AliasedField':
        info.fieldDef =
          info.type && state.name
            ? getFieldDef(schema, info.parentType, state.name)
            : null;
        info.type = info.fieldDef && info.fieldDef.type;
        break;
      case 'SelectionSet':
        info.parentType = getNamedType(info.type);
        break;
      case 'Directive':
        info.directiveDef = state.name && schema.getDirective(state.name);
        break;
      case 'Arguments':
        const parentDef =
          state.prevState.kind === 'Field'
            ? info.fieldDef
            : state.prevState.kind === 'Directive'
              ? info.directiveDef
              : state.prevState.kind === 'AliasedField'
                ? state.prevState.name &&
                  getFieldDef(schema, info.parentType, state.prevState.name)
                : null;
        info.argDefs = parentDef && parentDef.args;
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
        info.enumValue =
          enumType instanceof GraphQLEnumType
            ? find(enumType.getValues(), val => val.value === state.name)
            : null;
        break;
      case 'ListValue':
        const nullableType = getNullableType(info.inputType);
        info.inputType =
          nullableType instanceof GraphQLList ? nullableType.ofType : null;
        break;
      case 'ObjectValue':
        const objectType = getNamedType(info.inputType);
        info.objectFieldDefs =
          objectType instanceof GraphQLInputObjectType
            ? objectType.getFields()
            : null;
        break;
      case 'ObjectField':
        const objectField =
          state.name && info.objectFieldDefs
            ? info.objectFieldDefs[state.name]
            : null;
        info.inputType = objectField && objectField.type;
        break;
      case 'NamedType':
        info.type = schema.getType(state.name);
        break;
    }
  });

  return info;
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

// Returns the first item in the array which causes predicate to return truthy.
function find(array, predicate) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
}
