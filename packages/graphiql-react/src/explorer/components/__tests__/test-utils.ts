import { GraphQLNamedType, GraphQLType } from 'graphql';

import { ExplorerContextType, ExplorerNavStackItem } from '../../context';

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
