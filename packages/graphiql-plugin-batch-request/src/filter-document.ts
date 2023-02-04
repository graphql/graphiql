import {
  DocumentNode, FragmentDefinitionNode, Kind, OperationDefinitionNode,
  SelectionSetNode
} from 'graphql';

export const filterDocumentByOperationName = (
  document: DocumentNode, 
  operationName?: string
): DocumentNode => {
  let filteredOperation: OperationDefinitionNode | undefined;
  const fragments: Record<string, FragmentDefinitionNode> = {};

  for (const definition of document.definitions) {
    if (
      definition.kind === Kind.OPERATION_DEFINITION && 
      definition.name?.value === operationName
    ) {
      filteredOperation = definition;
    } else if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[definition.name.value] = definition;
    }
  }

  const getFragmentDefinitions = (
    selectionSet: SelectionSetNode | undefined
  ): Record<string, FragmentDefinitionNode> => {
  
    if (!selectionSet) {
      return {};
    }
  
    let filteredFragments: Record<string, FragmentDefinitionNode> = {};

    for(const selection of selectionSet.selections) {
      if(selection.kind === Kind.FRAGMENT_SPREAD) {
        const fragment = fragments[selection.name.value];
        filteredFragments = {
          ...filteredFragments,
          [selection.name.value]: fragment,
          ...getFragmentDefinitions(fragment.selectionSet)
        };
      } else {
        // technically at this point the only SelectionNode types we are looking for are 
        // FieldNode (Kind.FIELD) and InlineFragmentNode (Kind.INLINE_FRAGMENT) 
        // but leting validation handle that.
        filteredFragments = {
          ...filteredFragments,
          ...getFragmentDefinitions(selection.selectionSet)
        };
      }
    }
    
    return filteredFragments;
  }

  if (filteredOperation) {
    return {
      kind: Kind.DOCUMENT,
      definitions: [
        ...Object.values(getFragmentDefinitions(filteredOperation.selectionSet)),
        filteredOperation
      ]
    };
  }

  return {
    kind: Kind.DOCUMENT,
    definitions: []
  };
}