import { DocumentNode, FragmentDefinitionNode, parse, visit } from 'graphql';
import nullthrows from 'nullthrows';

export const getFragmentDependencies = (
  operationString: string,
  fragmentDefinitions?: Map<string, FragmentDefinitionNode> | null,
): FragmentDefinitionNode[] => {
  // If there isn't context for fragment references,
  // return an empty array.
  if (!fragmentDefinitions) {
    return [];
  }
  // If the operation cannot be parsed, validations cannot happen yet.
  // Return an empty array.
  let parsedOperation;
  try {
    parsedOperation = parse(operationString, {
      allowLegacySDLImplementsInterfaces: true,
      allowLegacySDLEmptyFields: true,
    });
  } catch (error) {
    return [];
  }
  return getFragmentDependenciesForAST(parsedOperation, fragmentDefinitions);
};

export const getFragmentDependenciesForAST = (
  parsedOperation: DocumentNode,
  fragmentDefinitions: Map<string, FragmentDefinitionNode>,
): FragmentDefinitionNode[] => {
  if (!fragmentDefinitions) {
    return [];
  }

  const existingFrags = new Map();
  const referencedFragNames = new Set<string>();

  visit(parsedOperation, {
    FragmentDefinition(node) {
      existingFrags.set(node.name.value, true);
    },
    FragmentSpread(node) {
      if (!referencedFragNames.has(node.name.value)) {
        referencedFragNames.add(node.name.value);
      }
    },
  });

  const asts = new Set<FragmentDefinitionNode>();
  referencedFragNames.forEach(name => {
    if (!existingFrags.has(name) && fragmentDefinitions.has(name)) {
      asts.add(nullthrows(fragmentDefinitions.get(name)));
    }
  });

  const referencedFragments: FragmentDefinitionNode[] = [];

  asts.forEach(ast => {
    visit(ast, {
      FragmentSpread(node) {
        if (
          !referencedFragNames.has(node.name.value) &&
          fragmentDefinitions.get(node.name.value)
        ) {
          asts.add(nullthrows(fragmentDefinitions.get(node.name.value)));
          referencedFragNames.add(node.name.value);
        }
      },
    });
    if (!existingFrags.has(ast.name.value)) {
      referencedFragments.push(ast);
    }
  });

  return referencedFragments;
};
