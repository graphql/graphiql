import { visit, parse } from 'graphql';
import type { FragmentDefinitionNode } from 'graphql';

export function getFragmentDefinitions(graphqlString: string) {
  const definitions: FragmentDefinitionNode[] = [];
  visit(parse(graphqlString), {
    FragmentDefinition(node) {
      definitions.push(node);
    },
  });
  return definitions;
}
