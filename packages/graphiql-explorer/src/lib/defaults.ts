/* eslint-disable */
// cSpell:disable
import {
  type GraphQLObjectType,
  isLeafType,
  Kind,
  GraphQLEnumType,
  GraphQLScalarType,
  ValueNode,
  isEnumType,
  GraphQLArgument,
  GraphQLInputField,
  ObjectFieldNode,
  isRequiredInputField,
  isInputObjectType,
} from 'graphql';
import { Field, GetDefaultScalarArgValue, MakeDefaultArg } from '../types';
import { unwrapInputType } from './utils';

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
