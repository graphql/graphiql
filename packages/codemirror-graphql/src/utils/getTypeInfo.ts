/**
 *  Copyright (c) 2021 GraphQL Contributors
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
  GraphQLSchema,
  GraphQLType,
  GraphQLObjectType,
  GraphQLField,
  GraphQLDirective,
  GraphQLArgument,
  GraphQLInputType,
  GraphQLEnumValue,
  GraphQLInputFieldMap,
} from 'graphql';
import type { State, Maybe } from 'graphql-language-service';

import {
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from 'graphql/type/introspection';

import forEachState from './forEachState';

export interface TypeInfo {
  schema: GraphQLSchema;
  type?: Maybe<GraphQLType>;
  parentType?: Maybe<GraphQLType>;
  inputType?: Maybe<GraphQLInputType>;
  directiveDef?: Maybe<GraphQLDirective>;
  fieldDef?: Maybe<GraphQLField<any, any>>;
  argDef?: Maybe<GraphQLArgument>;
  argDefs?: Maybe<GraphQLArgument[]>;
  enumValue?: Maybe<GraphQLEnumValue>;
  objectFieldDefs?: Maybe<GraphQLInputFieldMap>;
}

/**
 * Utility for collecting rich type information given any token's state
 * from the graphql-mode parser.
 */
export default function getTypeInfo(schema: GraphQLSchema, tokenState: State) {
  const info: TypeInfo = {
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

  forEachState(tokenState, (state: State) => {
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
        info.parentType = info.type ? getNamedType(info.type) : null;
        break;
      case 'Directive':
        info.directiveDef = state.name ? schema.getDirective(state.name) : null;
        break;
      case 'Arguments':
        const parentDef = state.prevState
          ? state.prevState.kind === 'Field'
            ? info.fieldDef
            : state.prevState.kind === 'Directive'
            ? info.directiveDef
            : state.prevState.kind === 'AliasedField'
            ? state.prevState.name &&
              getFieldDef(schema, info.parentType, state.prevState.name)
            : null
          : null;
        info.argDefs = parentDef ? (parentDef.args as GraphQLArgument[]) : null;
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
        const enumType = info.inputType ? getNamedType(info.inputType) : null;
        info.enumValue =
          enumType instanceof GraphQLEnumType
            ? find(
                enumType.getValues() as GraphQLEnumValue[],
                val => val.value === state.name,
              )
            : null;
        break;
      case 'ListValue':
        const nullableType = info.inputType
          ? getNullableType(info.inputType)
          : null;
        info.inputType =
          nullableType instanceof GraphQLList ? nullableType.ofType : null;
        break;
      case 'ObjectValue':
        const objectType = info.inputType ? getNamedType(info.inputType) : null;
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
        info.type = state.name ? schema.getType(state.name) : null;
        break;
    }
  });

  return info;
}

// Gets the field definition given a type and field name
function getFieldDef(
  schema: GraphQLSchema,
  type: Maybe<GraphQLType>,
  fieldName: string,
) {
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === type) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if (type && (type as GraphQLObjectType).getFields) {
    return (type as GraphQLObjectType).getFields()[fieldName];
  }
}

// Returns the first item in the array which causes predicate to return truthy.
function find<T>(array: T[], predicate: (item: T) => boolean) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
}
