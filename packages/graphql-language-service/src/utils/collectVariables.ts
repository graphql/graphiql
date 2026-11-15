import {
  typeFromAST,
  GraphQLSchema,
  DocumentNode,
  NamedTypeNode,
  GraphQLInputType,
  GraphQLFloat,
  Kind,
  type ConstValueNode,
} from 'graphql';

export type VariableToType = {
  [variable: string]: GraphQLInputType;
};

export type VariableInfo = {
  type: GraphQLInputType;
  defaultValue?: ConstValueNode;
};

export type VariableToInfo = {
  [variable: string]: VariableInfo;
};

/**
 * Generates a map of variable information for all the variables in an AST
 * document of operations.
 */
export function collectVariableInfo(
  schema: GraphQLSchema,
  documentAST: DocumentNode,
): VariableToInfo {
  const variableInfo: VariableToInfo = Object.create(null);
  // it would be more ideal to use visitWithTypeInfo here but it's very simple
  for (const definition of documentAST.definitions) {
    if (definition.kind === 'OperationDefinition') {
      const { variableDefinitions } = definition;
      if (variableDefinitions) {
        for (const { variable, type, defaultValue } of variableDefinitions) {
          const inputType = typeFromAST(
            schema,
            type as NamedTypeNode,
          ) as GraphQLInputType;
          if (inputType) {
            variableInfo[variable.name.value] = {
              type: inputType,
              defaultValue,
            };
          } else if (
            type.kind === Kind.NAMED_TYPE &&
            // in the experimental stream defer branch we are using, it seems typeFromAST() doesn't recognize Floats?
            type.name.value === 'Float'
          ) {
            variableInfo[variable.name.value] = {
              type: GraphQLFloat,
              defaultValue,
            };
          }
        }
      }
    }
  }
  return variableInfo;
}

/**
 * Generates a map of GraphQL input types for all the variables in an AST
 * document of operations.
 *
 * This preserves the original public API. Use collectVariableInfo when the
 * variable default values are also needed.
 */
export function collectVariables(
  schema: GraphQLSchema,
  documentAST: DocumentNode,
): VariableToType {
  const variableInfo = collectVariableInfo(schema, documentAST);
  const variableToType: VariableToType = Object.create(null);
  for (const [variableName, info] of Object.entries(variableInfo)) {
    variableToType[variableName] = info.type;
  }
  return variableToType;
}
