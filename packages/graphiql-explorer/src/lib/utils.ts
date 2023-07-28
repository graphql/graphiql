/* eslint-disable */
// cSpell:disable

import {
  isWrappingType,
  isNonNullType,
  isInputObjectType,
  isRequiredInputField,
  Kind,
  isLeafType,
  isEnumType,
  parse,
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
  OperationDefinitionNode,
  DocumentNode,
  GraphQLObjectType,
} from 'graphql';

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

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseQuery(text: string): null | DocumentNode | Error {
  try {
    if (!text.trim()) {
      return null;
    }
    return parse(
      text,
      // Tell graphql to not bother track locations when parsing, we don't need
      // it and it's a tiny bit more expensive.
      { noLocation: true },
    );
  } catch (e) {
    return new Error(e);
  }
}

const DEFAULT_OPERATION = {
  kind: Kind.OPERATION_DEFINITION,
  operation: 'query',
  variableDefinitions: [],
  name: { kind: Kind.NAME, value: 'MyQuery' },
  directives: [],
  selectionSet: {
    kind: Kind.SELECTION_SET,
    selections: [],
  },
} as OperationDefinitionNode;

export const DEFAULT_DOCUMENT = {
  kind: Kind.DOCUMENT,
  definitions: [DEFAULT_OPERATION],
} as DocumentNode;

let parseQueryMemoize: null | [string, DocumentNode] = null;
export function memoizeParseQuery(query: string): DocumentNode {
  if (parseQueryMemoize && parseQueryMemoize[0] === query) {
    return parseQueryMemoize[1];
  } else {
    const result = parseQuery(query);
    if (!result) {
      return DEFAULT_DOCUMENT;
    } else if (result instanceof Error) {
      if (parseQueryMemoize) {
        // Most likely a temporarily invalid query while they type
        return parseQueryMemoize[1];
      } else {
        return DEFAULT_DOCUMENT;
      }
    } else {
      parseQueryMemoize = [query, result];
      return result;
    }
  }
}
