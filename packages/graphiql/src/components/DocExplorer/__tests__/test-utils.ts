import { ExplorerContextType, ExplorerNavStackItem } from '@graphiql/react';
import { GraphQLNamedType, GraphQLType } from 'graphql';

export function mockExplorerContextValue(
  navStackItem: ExplorerNavStackItem,
): ExplorerContextType {
  return {
    explorerNavStack: [navStackItem],
    hide() {},
    isVisible: true,
    pop() {},
    push() {},
    reset() {},
    show() {},
    showSearch() {},
  };
}

export function unwrapType(type: GraphQLType): GraphQLNamedType {
  return 'ofType' in type ? unwrapType(type.ofType) : type;
}
