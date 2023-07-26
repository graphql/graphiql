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

export function defaultGetDefaultFieldNames(
  type: GraphQLObjectType,
): Array<string> {
  const fields = type.getFields();

  // Is there an `id` field?
  if (fields['id']) {
    const res = ['id'];
    if (fields['email']) {
      res.push('email');
    } else if (fields[Kind.NAME]) {
      res.push(Kind.NAME);
    }
    return res;
  }

  // Is there an `edges` field?
  if (fields['edges']) {
    return ['edges'];
  }

  // Is there an `node` field?
  if (fields['node']) {
    return ['node'];
  }

  if (fields['nodes']) {
    return ['nodes'];
  }

  // Include all leaf-type fields.
  const leafFieldNames: string[] = [];
  Object.keys(fields).forEach(fieldName => {
    if (isLeafType(fields[fieldName].type)) {
      leafFieldNames.push(fieldName);
    }
  });

  if (!leafFieldNames.length) {
    // No leaf fields, add typename so that the query stays valid
    return ['__typename'];
  }
  return leafFieldNames.slice(0, 2); // Prevent too many fields from being added
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
