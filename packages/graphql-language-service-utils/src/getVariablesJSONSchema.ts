import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLList,
  GraphQLScalarType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from 'graphql';

import type { JSONSchema6, JSONSchema6TypeName } from 'json-schema';
import type { VariableToType } from './collectVariables';

export type { JSONSchema6, JSONSchema6TypeName };

const scalarTypesMap: { [key: string]: JSONSchema6TypeName } = {
  Int: 'integer',
  String: 'string',
  Float: 'number',
  ID: 'string',
  Boolean: 'boolean',
  // { "type": "string", "format": "date" } is not compatible with proposed DateTime GraphQL-Scalars.com spec
  DateTime: 'string',
};

const scalarType = (definition: JSONSchema6, type: GraphQLScalarType) => {
  // I think this makes sense for custom scalars?
  definition.type = scalarTypesMap[type.name] ?? 'any';
};

const listType = (definition: JSONSchema6, type: GraphQLList<any>) => {
  definition.type = 'array';
  definition.items = {
    type: scalarTypesMap[type.ofType] ?? type.ofType,
  };
};
const enumType = (definition: JSONSchema6, type: GraphQLEnumType) => {
  definition.type = 'string';
  definition.enum = type.getValues().map(val => val.name);
};

const objectType = (definition: JSONSchema6, type: GraphQLInputObjectType) => {
  definition.type = 'object';
  const fields = type.getFields();
  if (!definition.properties) {
    definition.properties = {};
  }
  definition.required = [];

  Object.keys(fields).forEach(fieldName => {
    const {
      required,
      definition: fieldDefinition,
    } = getJSONSchemaFromGraphQLType(fields[fieldName].type);
    definition.properties![fieldName] = fieldDefinition;
    if (required) {
      definition.required!.push(fieldName);
    }
  });
};

type DefinitionResult = {
  definition: JSONSchema6;
  required: boolean;
};

/**
 *
 * @param type {GraphQLInputType}
 * @returns {DefinitionResult}
 */
function getJSONSchemaFromGraphQLType(
  type: GraphQLInputType,
): DefinitionResult {
  let required = false;
  let definition: JSONSchema6 = {};
  if ('description' in type) {
    definition.description = type.description as string;
  }
  if ('defaultValue' in type) {
    // @ts-ignore
    definition.default = type.defaultValue;
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
/**
 * Generate a JSONSchema6 valid document from a map of Map<string, GraphQLInputDefinition>
 *
 * TODO: optimize with shared definitions.
 * Otherwise, if you have multiple variables in your operations with the same input type, they are repeated.
 *
 * @param facts {OperationFacts} the result of getOperationFacts, or getOperationASTFacts
 * @returns {JSONSchema6}
 */
export function getVariablesJSONSchema(
  variableToType: VariableToType,
): JSONSchema6 {
  const jsonSchema: JSONSchema6 = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {},
    required: [],
  };

  if (variableToType) {
    Object.entries(variableToType).forEach(([variableName, type]) => {
      const { definition, required } = getJSONSchemaFromGraphQLType(type);
      jsonSchema.properties![variableName] = definition;
      if (required) {
        jsonSchema.required?.push(variableName);
      }
    });
  }
  return jsonSchema;
}
