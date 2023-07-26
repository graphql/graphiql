/* eslint-disable */
// cSpell:disable
import { isScalarType, Kind } from 'graphql';
import {
  ValueNode,
  GraphQLEnumType,
  GraphQLScalarType,
  GraphQLInputType,
} from 'graphql';

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
  }
  if (isScalarType(argType)) {
    try {
      switch (argType.name) {
        // same as default
        // case 'String':
        //   return {
        //     kind: Kind.STRING,
        //     value: String(argType.parseValue(value)),
        //   };
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
            }
            return { kind: Kind.BOOLEAN, value: false };
          } catch {
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
      return { kind: Kind.STRING, value };
    }
  } else {
    try {
      const parsedValue = argType.parseValue(value);
      if (parsedValue) {
        return { kind: Kind.ENUM, value: String(parsedValue) };
      }
      return { kind: Kind.ENUM, value: argType.getValues()[0].name };
    } catch (e) {
      return { kind: Kind.ENUM, value: argType.getValues()[0].name };
    }
  }
}
