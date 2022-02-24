/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  GraphQLInputField,
  GraphQLInputType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from 'graphql';

import type {
  JSONSchema4Type,
  JSONSchema6,
  JSONSchema6Definition,
  JSONSchema6TypeName,
} from 'json-schema';
import type { VariableToType } from './collectVariables';

export type { JSONSchema6, JSONSchema6TypeName };

export type JsonSchemaOptions = {
  /**
   * use undocumented `monaco-json` `markdownDescription` field in place of json-schema spec `description` field.
   */
  useMarkdownDescription?: boolean;
};

type PropertiedJSON6 = JSONSchema6 & {
  properties: {
    [k: string]: JSONSchema6;
  };
};

export type JSONSchemaOptions = {
  /**
   * whether to append a non-json schema valid 'markdownDescription` for `monaco-json`
   */
  useMarkdownDescription?: boolean;
};

export const defaultJSONSchemaOptions = {
  useMarkdownDescription: false,
};

export type MonacoEditorJSONSchema = JSONSchema6 & {
  markdownDescription?: string;
};

export type CombinedSchema = JSONSchema6 | MonacoEditorJSONSchema;

type Definitions = { [k: string]: JSONSchema6Definition };

export type DefinitionResult = {
  definition: JSONSchema6 | MonacoEditorJSONSchema;
  required: boolean;
  definitions?: Definitions;
};

function text(into: string[], newText: string) {
  into.push(newText);
}

function renderType(into: string[], t: GraphQLInputType | GraphQLInputField) {
  if (isNonNullType(t)) {
    renderType(into, t.ofType);
    text(into, '!');
  } else if (isListType(t)) {
    text(into, '[');
    // @ts-ignore
    renderType(into, t.ofType);
    text(into, ']');
  } else {
    text(into, t.name);
  }
}

function renderTypeToString(
  t: GraphQLInputType | GraphQLInputField,
  useMarkdown?: boolean,
) {
  const into: string[] = [];
  if (useMarkdown) {
    text(into, '```graphql\n');
  }
  renderType(into, t);
  if (useMarkdown) {
    text(into, '\n```');
  }
  return into.join('');
}

const scalarTypesMap: { [key: string]: JSONSchema6TypeName } = {
  Int: 'integer',
  String: 'string',
  Float: 'number',
  ID: 'string',
  Boolean: 'boolean',
  // { "type": "string", "format": "date" } is not compatible with proposed DateTime GraphQL-Scalars.com spec
  DateTime: 'string',
};

/**
 *
 * @param type {GraphQLInputType}
 * @returns {DefinitionResult}
 */
function getJSONSchemaFromGraphQLType(
  type: GraphQLInputType | GraphQLInputField,
  options?: JSONSchemaOptions,
): DefinitionResult {
  let required = false;
  let definition: CombinedSchema = Object.create(null);
  const definitions: Definitions = Object.create(null);

  // TODO: test that this works?
  if ('defaultValue' in type && type.defaultValue !== undefined) {
    definition.default = type.defaultValue as JSONSchema4Type | undefined;
  }
  if (isEnumType(type)) {
    definition.type = 'string';
    definition.enum = type.getValues().map(val => val.name);
  }

  if (isScalarType(type)) {
    // I think this makes sense for custom scalars?
    definition.type = scalarTypesMap[type.name] ?? 'any';
  }
  if (isListType(type)) {
    definition.type = 'array';
    const { definition: def, definitions: defs } = getJSONSchemaFromGraphQLType(
      type.ofType,
      options,
    );
    if (def.$ref) {
      definition.items = { $ref: def.$ref };
    } else {
      definition.items = def;
    }
    if (defs) {
      Object.keys(defs).forEach(defName => {
        definitions[defName] = defs[defName];
      });
    }
  }
  if (isNonNullType(type)) {
    required = true;
    const { definition: def, definitions: defs } = getJSONSchemaFromGraphQLType(
      type.ofType,
      options,
    );
    definition = def;
    if (defs) {
      Object.keys(defs).forEach(defName => {
        definitions[defName] = defs[defName];
      });
    }
  }
  if (isInputObjectType(type)) {
    definition.$ref = `#/definitions/${type.name}`;
    const fields = type.getFields();

    const fieldDef: PropertiedJSON6 = {
      type: 'object',
      properties: {},
      required: [],
    };
    if (type.description) {
      fieldDef.description = type.description + `\n` + renderTypeToString(type);
      if (options?.useMarkdownDescription) {
        // @ts-expect-error
        fieldDef.markdownDescription =
          type.description + `\n` + renderTypeToString(type, true);
      }
    } else {
      fieldDef.description = renderTypeToString(type);
      if (options?.useMarkdownDescription) {
        // @ts-expect-error
        fieldDef.markdownDescription = renderTypeToString(type, true);
      }
    }

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const {
        required: fieldRequired,
        definition: typeDefinition,
        definitions: typeDefinitions,
      } = getJSONSchemaFromGraphQLType(field.type, options);

      const {
        definition: fieldDefinition,
        // definitions: fieldDefinitions,
      } = getJSONSchemaFromGraphQLType(field, options);

      fieldDef.properties[fieldName] = {
        ...typeDefinition,
        ...fieldDefinition,
      } as JSONSchema6;

      const renderedField = renderTypeToString(field.type);
      fieldDef.properties[fieldName].description = field.description
        ? field.description + '\n' + renderedField
        : renderedField;
      if (options?.useMarkdownDescription) {
        const renderedFieldMarkdown = renderTypeToString(field.type, true);
        fieldDef.properties[
          fieldName
          // @ts-expect-error
        ].markdownDescription = field.description
          ? field.description + '\n' + renderedFieldMarkdown
          : renderedFieldMarkdown;
      }

      if (fieldRequired) {
        fieldDef.required!.push(fieldName);
      }
      if (typeDefinitions) {
        Object.keys(typeDefinitions).map(defName => {
          definitions[defName] = typeDefinitions[defName];
        });
      }
    });
    definitions![type.name] = fieldDef;
  }
  // append descriptions
  if (
    'description' in type &&
    !isScalarType(type) &&
    type.description &&
    !definition.description
  ) {
    definition.description = type.description + '\n' + renderTypeToString(type);
    if (options?.useMarkdownDescription) {
      // @ts-expect-error
      definition.markdownDescription =
        type.description + '\n' + renderTypeToString(type, true);
    }
  } else {
    definition.description = renderTypeToString(type);
    if (options?.useMarkdownDescription) {
      // @ts-expect-error
      definition.markdownDescription = renderTypeToString(type, true);
    }
  }

  return { required, definition, definitions };
}
/**
 * Generates a JSONSchema6 valid document for operation(s) from a map of Map<string, GraphQLInputType>.
 *
 * It generates referenced Definitions for each type, so that no graphql types are repeated.
 *
 * Note: you must install `@types/json-schema` if you want a valid result type
 *
 * @param facts {OperationFacts} the result of getOperationFacts, or getOperationASTFacts
 * @returns {JSONSchema6}'
 *
 * @example
 * simple usage:
 *
 * ```ts
 * import { parse } from 'graphql'
 * import { collectVariables, getVariablesJSONSchema } from 'graphql-language-service'
 * const variablesToType = collectVariables(parse(query), schema)
 * const JSONSchema6Result = getVariablesJSONSchema(variablesToType, schema)
 * ```
 *
 * @example
 * advanced usage:
 * ```ts
 *
 * import { parse } from 'graphql'
 * import { collectVariables, getVariablesJSONSchema } from 'graphql-language-service'
 * const variablesToType = collectVariables(parse(query), schema)
 *
 * // you can append `markdownDescription` to JSON schema, which  monaco-json uses.
 * const JSONSchema6Result = getVariablesJSONSchema(variablesToType, schema, { useMarkdownDescription: true })
 *
 * // let's say we want to use it with an IDE extension that expects a JSON file
 * // the resultant object literal can be written to string
 * import fs from 'fs/promises'
 * await fs.writeFile('operation-schema.json', JSON.stringify(JSONSchema6Result, null, 2))
 * ```
 */
export function getVariablesJSONSchema(
  variableToType: VariableToType,
  options?: JSONSchemaOptions,
): JSONSchema6 {
  const jsonSchema: PropertiedJSON6 = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {},
    required: [],
  };

  if (variableToType) {
    // I would use a reduce here, but I wanted it to be readable.
    Object.entries(variableToType).forEach(([variableName, type]) => {
      const {
        definition,
        required,
        definitions,
      } = getJSONSchemaFromGraphQLType(type, options);
      jsonSchema.properties[variableName] = definition;
      if (required) {
        jsonSchema.required?.push(variableName);
      }
      if (definitions) {
        jsonSchema.definitions = { ...jsonSchema?.definitions, ...definitions };
      }
    });
  }
  return jsonSchema;
}
