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
  /**
   * Scalar schema mappings.
   */
  scalarSchemas?: Record<string, JSONSchema6>;
};
type JSONSchemaRunningOptions = JSONSchemaOptions & {
  definitionMarker: Marker;
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

function renderDefinitionDescription(
  t: GraphQLInputType | GraphQLInputField,
  useMarkdown?: boolean,
  description?: string | undefined | null,
) {
  const into: string[] = [];

  const type = 'type' in t ? t.type : t;

  // input field description
  if ('type' in t && t.description) {
    text(into, t.description);
    text(into, '\n\n');
  }

  // type
  text(into, renderTypeToString(type, useMarkdown));

  // type description
  if (description) {
    text(into, '\n');
    text(into, description);
  } else if (!isScalarType(type) && 'description' in type && type.description) {
    text(into, '\n');
    text(into, type.description);
  } else if (
    'ofType' in type &&
    !isScalarType(type.ofType) &&
    'description' in type.ofType &&
    type.ofType.description
  ) {
    text(into, '\n');
    text(into, type.ofType.description);
  }

  return into.join('');
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

const defaultScalarTypesMap: { [key: string]: JSONSchema6 } = {
  Int: { type: 'integer' },
  String: { type: 'string' },
  Float: { type: 'number' },
  ID: { type: 'string' },
  Boolean: { type: 'boolean' },
  // { "type": "string", "format": "date" } is not compatible with proposed DateTime GraphQL-Scalars.com spec
  DateTime: { type: 'string' },
};

class Marker {
  private set = new Set<string>();

  mark(name: string): boolean {
    if (this.set.has(name)) {
      return false;
    }
    this.set.add(name);
    return true;
  }
}

/**
 *
 * @param type {GraphQLInputType}
 * @param options
 * @returns {DefinitionResult}
 */
function getJSONSchemaFromGraphQLType(
  fieldOrType: GraphQLInputType | GraphQLInputField,
  options?: JSONSchemaRunningOptions,
): DefinitionResult {
  let definition: CombinedSchema = Object.create(null);
  const definitions: Definitions = Object.create(null);

  // field or type
  const isField = 'type' in fieldOrType;
  // type
  const type = isField ? fieldOrType.type : fieldOrType;
  // base type
  const baseType = isNonNullType(type) ? type.ofType : type;
  const required = isNonNullType(type);

  if (isScalarType(baseType)) {
    //  scalars
    if (options?.scalarSchemas?.[baseType.name]) {
      // deep clone
      definition = JSON.parse(
        JSON.stringify(options.scalarSchemas[baseType.name]),
      );
    } else {
      // any
      definition.type = ['string', 'number', 'boolean', 'integer'];
    }
    if (!required) {
      if (Array.isArray(definition.type)) {
        definition.type.push('null');
      } else if (definition.type) {
        definition.type = [definition.type, 'null'];
      } else if (definition.enum) {
        definition.enum.push(null);
      } else if (definition.oneOf) {
        definition.oneOf.push({ type: 'null' });
      } else {
        definition = {
          oneOf: [definition, { type: 'null' }],
        };
      }
    }
  } else if (isEnumType(baseType)) {
    definition.enum = baseType.getValues().map(val => val.name);
    if (!required) {
      definition.enum.push(null);
    }
  } else if (isListType(baseType)) {
    if (required) {
      definition.type = 'array';
    } else {
      definition.type = ['array', 'null'];
    }

    const { definition: def, definitions: defs } = getJSONSchemaFromGraphQLType(
      baseType.ofType,
      options,
    );

    definition.items = def;

    if (defs) {
      for (const defName of Object.keys(defs)) {
        definitions[defName] = defs[defName];
      }
    }
  } else if (isInputObjectType(baseType)) {
    if (required) {
      definition.$ref = `#/definitions/${baseType.name}`;
    } else {
      definition.oneOf = [
        { $ref: `#/definitions/${baseType.name}` },
        { type: 'null' },
      ];
    }
    if (options?.definitionMarker?.mark(baseType.name)) {
      const fields = baseType.getFields();

      const fieldDef: PropertiedJSON6 = {
        type: 'object',
        properties: {},
        required: [],
      };

      fieldDef.description = renderDefinitionDescription(baseType);
      if (options?.useMarkdownDescription) {
        // @ts-expect-error
        fieldDef.markdownDescription = renderDefinitionDescription(
          baseType,
          true,
        );
      }

      for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];
        const {
          required: fieldRequired,
          definition: fieldDefinition,
          definitions: typeDefinitions,
        } = getJSONSchemaFromGraphQLType(field, options);

        fieldDef.properties[fieldName] = fieldDefinition;

        if (fieldRequired) {
          fieldDef.required!.push(fieldName);
        }
        if (typeDefinitions) {
          for (const [defName, value] of Object.entries(typeDefinitions)) {
            definitions[defName] = value;
          }
        }
      }
      definitions[baseType.name] = fieldDef;
    }
  }

  if ('defaultValue' in fieldOrType && fieldOrType.defaultValue !== undefined) {
    definition.default = fieldOrType.defaultValue as
      | JSONSchema4Type
      | undefined;
  }

  // append to type descriptions, or schema description
  const { description } = definition;
  definition.description = renderDefinitionDescription(
    fieldOrType,
    false,
    description,
  );
  if (options?.useMarkdownDescription) {
    // @ts-expect-error
    definition.markdownDescription = renderDefinitionDescription(
      fieldOrType,
      true,
      description,
    );
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
    // this gets monaco-json validation working again
    // otherwise it shows an error for newer schema draft versions
    // variables and graphql types are simple and compatible with all versions of json schema
    // since draft 4. package.json and many other schemas still use draft 4
    $schema: 'http://json-schema.org/draft-04/schema',
    type: 'object',
    properties: {},
    required: [],
  };

  const runtimeOptions: JSONSchemaRunningOptions = {
    ...options,
    definitionMarker: new Marker(),
    scalarSchemas: {
      ...defaultScalarTypesMap,
      ...options?.scalarSchemas,
    },
  };

  if (variableToType) {
    // I would use a reduce here, but I wanted it to be readable.
    for (const [variableName, type] of Object.entries(variableToType)) {
      const { definition, required, definitions } =
        getJSONSchemaFromGraphQLType(type, runtimeOptions);
      jsonSchema.properties[variableName] = definition;
      if (required) {
        jsonSchema.required?.push(variableName);
      }
      if (definitions) {
        jsonSchema.definitions = { ...jsonSchema?.definitions, ...definitions };
      }
    }
  }
  return jsonSchema;
}
