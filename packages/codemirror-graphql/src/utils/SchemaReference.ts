/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { getNamedType, GraphQLSchema } from 'graphql';

import type {
  GraphQLArgument,
  GraphQLDirective,
  GraphQLEnumValue,
  GraphQLEnumType,
  GraphQLField,
  GraphQLNamedType,
} from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { TypeInfo } from './getTypeInfo';

export type SchemaReference =
  | FieldReference
  | DirectiveReference
  | ArgumentReference
  | EnumValueReference
  | TypeReference;

export type FieldReference = {
  kind: 'Field';
  field: GraphQLField<any, any>;
  type: Maybe<GraphQLNamedType>;
  schema?: GraphQLSchema;
};

export type DirectiveReference = {
  kind: 'Directive';
  directive: GraphQLDirective;
  schema?: GraphQLSchema;
};

export type ArgumentReference = {
  kind: 'Argument';
  argument: GraphQLArgument;
  field?: GraphQLField<any, any>;
  type?: GraphQLNamedType;
  directive?: GraphQLDirective;
  schema?: GraphQLSchema;
};

export type EnumValueReference = {
  kind: 'EnumValue';
  value?: GraphQLEnumValue;
  type?: GraphQLEnumType;
  schema?: GraphQLSchema;
};

export type TypeReference = {
  kind: 'Type';
  type: GraphQLNamedType;
  schema?: GraphQLSchema;
};

export function getFieldReference(typeInfo: any): FieldReference {
  return {
    kind: 'Field',
    schema: typeInfo.schema,
    field: typeInfo.fieldDef,
    type: isMetaField(typeInfo.fieldDef) ? null : typeInfo.parentType,
  };
}

export function getDirectiveReference(typeInfo: any): DirectiveReference {
  return {
    kind: 'Directive',
    schema: typeInfo.schema,
    directive: typeInfo.directiveDef,
  };
}

export function getArgumentReference(typeInfo: any): ArgumentReference {
  return typeInfo.directiveDef
    ? {
        kind: 'Argument',
        schema: typeInfo.schema,
        argument: typeInfo.argDef,
        directive: typeInfo.directiveDef,
      }
    : {
        kind: 'Argument',
        schema: typeInfo.schema,
        argument: typeInfo.argDef,
        field: typeInfo.fieldDef,
        type: isMetaField(typeInfo.fieldDef) ? null : typeInfo.parentType,
      };
}

export function getEnumValueReference(typeInfo: TypeInfo): EnumValueReference {
  return {
    kind: 'EnumValue',
    value: typeInfo.enumValue || undefined,
    // $FlowFixMe
    type: typeInfo.inputType
      ? (getNamedType(typeInfo.inputType) as GraphQLEnumType)
      : undefined,
  };
}

// Note: for reusability, getTypeReference can produce a reference to any type,
// though it defaults to the current type.
export function getTypeReference(
  typeInfo: any,
  type?: Maybe<GraphQLNamedType>,
): TypeReference {
  return {
    kind: 'Type',
    schema: typeInfo.schema,
    type: type || typeInfo.type,
  };
}

function isMetaField(fieldDef: GraphQLField<any, any>) {
  return fieldDef.name.slice(0, 2) === '__';
}
