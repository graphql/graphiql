/* eslint-disable */
// cSpell:disable

import {
  isWrappingType,
  isNonNullType,
  isInputObjectType,
  isRequiredInputField,
  Kind,
  isLeafType,
  isScalarType,
  isEnumType,
} from 'graphql';

import type {
  ObjectFieldNode,
  GraphQLScalarType,
  GraphQLEnumType,
  ValueNode,
  GraphQLArgument,
  GraphQLInputField,
  GraphQLOutputType,
  GraphQLInputType,
} from 'graphql';

import { Field, GetDefaultScalarArgValue, MakeDefaultArg } from './types';

export function unwrapOutputType(outputType: GraphQLOutputType) {
  let unwrappedType = outputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

export function unwrapInputType(inputType: GraphQLInputType) {
  let unwrappedType = inputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}
export function isRequiredArgument(arg: GraphQLArgument): boolean {
  return isNonNullType(arg.type) && arg.defaultValue === undefined;
}

export function defaultInputObjectFields(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: null | MakeDefaultArg,
  parentField: Field,
  fields: Array<GraphQLInputField>,
): Array<ObjectFieldNode> {
  const nodes = [];
  for (const field of fields) {
    if (
      isRequiredInputField(field) ||
      (makeDefaultArg && makeDefaultArg(parentField, field))
    ) {
      const fieldType = unwrapInputType(field.type);
      if (isInputObjectType(fieldType)) {
        const fields = fieldType.getFields();
        nodes.push({
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: field.name },
          value: {
            kind: Kind.OBJECT,
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              parentField,
              Object.keys(fields).map(k => fields[k]),
            ),
          },
        });
      } else if (isLeafType(fieldType)) {
        nodes.push({
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: field.name },
          value: getDefaultScalarArgValue(parentField, field, fieldType),
        });
      }
    }
  }
  return nodes;
}

export function coerceArgValue(
  argType: GraphQLScalarType | GraphQLInputType,
  value: string,
): ValueNode;

export function coerceArgValue(
  argType: GraphQLEnumType,
  value: unknown,
): ValueNode;

export function coerceArgValue(argType, value) {
  // Handle the case where we're setting a variable as the value
  if (typeof value !== 'string' && value.kind === Kind.VARIABLE_DEFINITION) {
    return value.variable;
  } else if (isScalarType(argType)) {
    try {
      switch (argType.name) {
        case 'String':
          return {
            kind: Kind.STRING,
            value: String(argType.parseValue(value)),
          };
        case 'Float':
          return {
            kind: Kind.FLOAT,
            value: String(argType.parseValue(parseFloat(value))),
          };
        case 'Int':
          return {
            kind: Kind.INT,
            value: String(argType.parseValue(parseInt(value, 10))),
          };
        case 'Boolean':
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'boolean') {
              return { kind: Kind.BOOLEAN, value: parsed };
            } else {
              return { kind: Kind.BOOLEAN, value: false };
            }
          } catch (e) {
            return {
              kind: Kind.BOOLEAN,
              value: false,
            };
          }
        default:
          return {
            kind: Kind.STRING,
            value: String(argType.parseValue(value)),
          };
      }
    } catch (e) {
      console.error('error coercing arg value', e, value);
      return { kind: Kind.STRING, value: value };
    }
  } else {
    try {
      const parsedValue = argType.parseValue(value);
      if (parsedValue) {
        return { kind: Kind.ENUM, value: String(parsedValue) };
      } else {
        return { kind: Kind.ENUM, value: argType.getValues()[0].name };
      }
    } catch (e) {
      return { kind: Kind.ENUM, value: argType.getValues()[0].name };
    }
  }
}

export function defaultValue(
  argType: GraphQLEnumType | GraphQLScalarType,
): ValueNode {
  if (isEnumType(argType)) {
    return { kind: Kind.ENUM, value: argType.getValues()[0].name };
  } else {
    switch (argType.name) {
      case 'String':
        return { kind: Kind.STRING, value: '' };
      case 'Float':
        return { kind: Kind.FLOAT, value: '1.5' };
      case 'Int':
        return { kind: Kind.INT, value: '10' };
      case 'Boolean':
        return { kind: Kind.BOOLEAN, value: false };
      default:
        return { kind: Kind.STRING, value: '' };
    }
  }
}

export function defaultGetDefaultScalarArgValue(
  _parentField: Field,
  _arg: GraphQLArgument | GraphQLInputField,
  argType: GraphQLEnumType | GraphQLScalarType,
): ValueNode {
  return defaultValue(argType);
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
