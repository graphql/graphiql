/** @flow */
/**
 *  Copyright (c), Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {getNamedType} from 'graphql';

import type {
  GraphQLArgument,
  GraphQLDirective,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLNamedType,
} from 'graphql';

export type SchemaReference =
  | FieldReference
  | DirectiveReference
  | ArgumentReference
  | EnumValueReference
  | TypeReference;

export type FieldReference = {
  kind: 'Field',
  field: GraphQLField,
  type: ?GraphQLNamedType,
};

export type DirectiveReference = {
  kind: 'Directive',
  directive: GraphQLDirective,
};

export type ArgumentReference = {
  kind: 'Argument',
  argument: GraphQLArgument,
  field?: GraphQLField,
  type?: ?GraphQLNamedType,
  directive?: GraphQLDirective,
};

export type EnumValueReference = {
  kind: 'EnumValue',
  value: GraphQLEnumValue,
  type: GraphQLEnumType,
};

export type TypeReference = {
  kind: 'Type',
  type: GraphQLNamedType,
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

export function getEnumValueReference(typeInfo: any): EnumValueReference {
  return {
    kind: 'EnumValue',
    value: typeInfo.enumValue,
    type: getNamedType(typeInfo.inputType),
  };
}

// Note: for reusability, getTypeReference can produce a reference to any type,
// though it defaults to the current type.
export function getTypeReference(
  typeInfo: any,
  type?: GraphQLNamedType,
): TypeReference {
  return {
    kind: 'Type',
    schema: typeInfo.schema,
    type: type || typeInfo.type,
  };
}

function isMetaField(fieldDef) {
  return fieldDef.name.slice(0, 2) === '__';
}
