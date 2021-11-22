import {
  GraphQLEnumType,
  GraphQLInputField,
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

import type {
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

const listType = (
  definition: JSONSchema6,
  type: GraphQLList<any>,
  definitions: Definitions,
) => {
  definition.type = 'array';
  const { definition: def, definitions: defs } = getJSONSchemaFromGraphQLType(
    type.ofType,
  );
  definition.items = { $ref: def.$ref };
  definitions = {
    ...definitions,
    ...defs,
  };
};
const enumType = (definition: JSONSchema6, type: GraphQLEnumType) => {
  definition.type = 'string';
  definition.enum = type.getValues().map(val => val.name);
};

const inputObjectType = (
  definition: CombinedSchema,
  type: GraphQLInputObjectType,
  definitions: Definitions,
  options?: JsonSchemaOptions,
) => {
  definition.$ref = `#/definitions/${type.name}`;
  definition.description = undefined;
  if (!definitions || !definitions[type.name]) {
    const fields = type.getFields();
    const fieldDef: JSONSchema6 = {
      type: 'object',
      properties: {},
      required: [],
    };
    if (type.description) {
      fieldDef.description = type.description;
    }
    if (options?.useMarkdownDescription) {
      // @ts-expect-error
      fieldDef.markdownDescription = type.description;
    }
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const {
        required,
        definition: typeDefinition,
      } = getJSONSchemaFromGraphQLType(field.type, options);
      const { definition: fieldDefinition } = getJSONSchemaFromGraphQLType(
        fields[fieldName],
        options,
      );
      fieldDef.properties![fieldName] = {
        ...typeDefinition,
        ...fieldDefinition,
      };
      if (required) {
        fieldDef.required!.push(fieldName);
      }
    });
    definitions![type.name] = fieldDef;
  } else {
    return;
  }
  // definition.type = 'object';
  // if (!definition.properties) {
  //   definition.properties = {};
  // }
  // definition.required = [];
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
  if (!t) {
    return;
  }
  if (isNonNullType(t)) {
    renderType(into, t.ofType);
    text(into, '!');
  } else if (t instanceof GraphQLList) {
    text(into, '[');
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
    text(into, '\n```graphql\n');
  }
  renderType(into, t);
  if (useMarkdown) {
    text(into, '\n```\n');
  }
  return into.join('');
}

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
  let definition: CombinedSchema = {};
  let definitions: Definitions = {};

  definition.description = renderTypeToString(type);
  const hasDescription = 'description' in type && type.description;
  if ('description' in type && type.description) {
    definition.description += type.description;
  }
  if (options?.useMarkdownDescription) {
    // @ts-expect-error
    definition.markdownDescription = renderTypeToString(type, true);
    if (hasDescription) {
      // @ts-expect-error
      definition.markdownDescription += type.description;
    }
  }

  // TODO: test that this works?
  if ('defaultValue' in type) {
    // @ts-ignore
    definition.default = type.defaultValue;
  }
  if (isEnumType(type)) {
    enumType(definition, type);
  }
  if (isInputObjectType(type)) {
    inputObjectType(definition, type, definitions, options);
  }

  if (isScalarType(type)) {
    scalarType(definition, type);
  }
  if (isListType(type)) {
    listType(definition, type, definitions);
  }
  if (isNonNullType(type)) {
    required = true;
    const { definition: def, definitions: defs } = getJSONSchemaFromGraphQLType(
      type.ofType,
      options,
    );
    definition = def;
    definitions = {
      ...definitions,
      ...defs,
    };
  }

  return { required, definition, definitions };
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
  options?: JSONSchemaOptions,
): JSONSchema6 {
  const jsonSchema: JSONSchema6 = {
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
      jsonSchema.properties![variableName] = definition;
      if (required) {
        jsonSchema.required?.push(variableName);
      }
      if (definitions) {
        jsonSchema.definitions = definitions;
      }
    });
  }
  return jsonSchema;
}
