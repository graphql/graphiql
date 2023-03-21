import {
  typeFromAST,
  GraphQLSchema,
  DocumentNode,
  NamedTypeNode,
  GraphQLInputType,
  GraphQLFloat,
  Kind,
} from 'graphql';

export type VariableToType = {
  [variable: string]: GraphQLInputType;
};

/**
 * Generates a map of GraphQLInputTypes for
 * all the variables in an AST document of operations
 *
 * @param schema
 * @param documentAST
 * @returns {VariableToType}
 */
export function collectVariables(
  schema: GraphQLSchema,
  documentAST: DocumentNode,
): VariableToType {
  const variableToType: VariableToType = Object.create(null);
  // it would be more ideal to use visitWithTypeInfo here but it's very simple
  for (const definition of documentAST.definitions) {
    if (definition.kind === 'OperationDefinition') {
      const { variableDefinitions } = definition;
      if (variableDefinitions) {
        for (const { variable, type } of variableDefinitions) {
          const inputType = typeFromAST(
            schema,
            type as NamedTypeNode,
          ) as GraphQLInputType;
          if (inputType) {
            variableToType[variable.name.value] = inputType;
          } else if (
            type.kind === Kind.NAMED_TYPE &&
            // in the experimental stream defer branch we are using, it seems typeFromAST() doesn't recognize Floats?
            type.name.value === 'Float'
          ) {
            variableToType[variable.name.value] = GraphQLFloat;
          }
        }
      }
    }
  }
  return variableToType;
}
