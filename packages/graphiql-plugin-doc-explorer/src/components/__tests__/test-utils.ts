'use no memo';
import { useRef } from 'react';
import { GraphQLNamedType, GraphQLType } from 'graphql';
import { createDocExplorerStore, DocExplorerNavStackItem } from '../../context';

export function useMockDocExplorerContextValue(
  navStackItem: DocExplorerNavStackItem,
) {
  return useRef(createDocExplorerStore(navStackItem));
}

export function unwrapType(type: GraphQLType): GraphQLNamedType {
  return 'ofType' in type ? unwrapType(type.ofType) : type;
}
