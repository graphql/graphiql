import { 
  DocumentNode, 
  Kind, 
  FragmentDefinitionNode, 
  OperationDefinitionNode, 
  SelectionSetNode
} from 'graphql';

export const filterDocumentByOperationName = (
  document: DocumentNode, 
  operationName?: string
): DocumentNode => {
  let filteredOperation: OperationDefinitionNode | undefined;
  const fragments: Record<string, FragmentDefinitionNode> = {};

  document.definitions.forEach(definition => {
    if (definition.kind === Kind.OPERATION_DEFINITION && definition.name?.value === operationName) {
      filteredOperation = definition;
    }
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[definition.name.value] = definition;
    }
  });

  if (filteredOperation) {
    const filteredFragments = filterSelectionSet(filteredOperation.selectionSet, fragments);
    return {
      kind: Kind.DOCUMENT,
      definitions: [
        ...Object.values(filteredFragments), 
        filteredOperation
      ]
    };
  }

  return {
    kind: Kind.DOCUMENT,
    definitions: []
  };
}

export const filterSelectionSet = (
  selectionSet: SelectionSetNode | undefined, 
  fragments: Record<string, FragmentDefinitionNode>
): Record<string, FragmentDefinitionNode> => {

  if (!selectionSet) {
    return {};
  }

  let filteredFragments: Record<string, FragmentDefinitionNode> = {};

  selectionSet.selections.forEach(selection => {
    if(selection.kind === Kind.FRAGMENT_SPREAD && fragments[selection.name.value]) {
      const fragment = fragments[selection.name.value];
      filteredFragments = {
        ...filteredFragments,
        [selection.name.value]: fragment,
        ...filterSelectionSet(fragment.selectionSet, fragments)
      };
    }
    else if (selection.kind === Kind.FIELD || selection.kind === Kind.INLINE_FRAGMENT) {
      filteredFragments = {
        ...filteredFragments,
        ...filterSelectionSet(selection.selectionSet, fragments)
      };
    }
  });
  
  return filteredFragments;
}