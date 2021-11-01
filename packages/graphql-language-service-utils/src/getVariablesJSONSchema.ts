import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLScalarType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from 'graphql';

import type { JSONSchema6, JSONSchema6TypeName } from 'json-schema';

import type { OperationFacts } from './getOperationFacts';

const scalarTypesMap: { [key: string]: JSONSchema6TypeName } = {
  Int: 'integer',
  String: 'string',
  Float: 'number',
  ID: 'string',
  Boolean: 'boolean',
  // "format": "date" is not compatible with proposed DateTime GraphQL-Scalars.com spec
  DateTime: 'string',
};

const scalarType = (definition: JSONSchema6, type: GraphQLScalarType) => {
  definition.type = scalarTypesMap[type.name];
};

const listType = (definition: JSONSchema6, type: GraphQLList<any>) => {
  definition.type = 'array';
  definition.items = { type: scalarTypesMap[type.ofType] || type.ofType };
};
const enumType = (definition: JSONSchema6, type: GraphQLEnumType) => {
  definition.type = 'string';
  definition.enum = type.getValues().map(val => val.name);
};

const objectType = (
  definition: JSONSchema6,
  type: GraphQLObjectType | GraphQLInterfaceType | GraphQLInputObjectType,
) => {
  definition.type = 'object';
  const fields = type.getFields();
  if (!definition.properties) {
    definition.properties = {};
  }
  definition.required = [];

  Object.keys(fields).forEach((fieldName: string) => {
    const {
      required,
      definition: fieldDefinition,
    } = getJSONSchemaFromGraphQLType(
      fields[fieldName].type as GraphQLInputType,
    );
    definition.properties![fieldName] = fieldDefinition;
    if (required) {
      definition.required?.push(fieldName);
    }
  });
};

function getJSONSchemaFromGraphQLType(
  type: GraphQLInputType,
): { definition: JSONSchema6; required: boolean } {
  let required = false;
  let definition: JSONSchema6 = {};
  if ('description' in type) {
    definition.description = type.description as string;
  }
  if (isEnumType(type)) {
    enumType(definition, type);
  }
  if (isInputObjectType(type)) {
    objectType(definition, type);
  }
  if (isListType(type)) {
    listType(definition, type);
  }
  if (isScalarType(type)) {
    scalarType(definition, type);
  }
  if (isNonNullType(type)) {
    required = true;
    definition = getJSONSchemaFromGraphQLType(type.ofType).definition;
  }

  return { required, definition };
}

export function getVariablesJSONSchema(facts: OperationFacts) {
  const jsonSchema: JSONSchema6 = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'monaco://variables-schema.json',
    title: 'GraphQL Variables',
    type: 'object',
    properties: {},
    required: [],
  };

  if (facts && facts.variableToType) {
    Object.entries(facts.variableToType).forEach(([variableName, type]) => {
      const { definition, required } = getJSONSchemaFromGraphQLType(type);
      jsonSchema.properties![variableName] = definition;
      if (required) {
        jsonSchema.required?.push(variableName);
      }
    });
  }
  return jsonSchema;
}
