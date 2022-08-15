import { GraphQLNamedType, GraphQLType } from 'graphql';

import { ExplorerContextType, ExplorerNavStackItem } from '../../context';

export function mockExplorerContextValue(
  navStackItem: ExplorerNavStackItem,
): ExplorerContextType {
  return {
    explorerNavStack: [navStackItem],
    pop() {},
    push() {},
    reset() {},
  };
}

export function unwrapType(type: GraphQLType): GraphQLNamedType {
  return 'ofType' in type ? unwrapType(type.ofType) : type;
}
