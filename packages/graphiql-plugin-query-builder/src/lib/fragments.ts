import {
  Kind,
  visit,
  type DocumentNode,
  type FragmentDefinitionNode,
  type FragmentSpreadNode,
  type SelectionSetNode,
} from 'graphql';

import {
  findOperation,
  findSelectionSet,
  mapOperation,
  replaceFieldSelectionSet,
  type PathSegment,
} from './ast-path';

/**
 * Returns the names of all named fragment definitions in `doc`, in document
 * order.
 */
export function listFragments(doc: DocumentNode): string[] {
  return doc.definitions
    .filter(
      (d): d is FragmentDefinitionNode => d.kind === Kind.FRAGMENT_DEFINITION,
    )
    .map(f => f.name.value);
}

/**
 * Extracts the selection set of the field at `path` into a new named fragment
 * definition (`fragmentName on typeName`), and replaces the field's selections
 * with a single fragment spread (`...fragmentName`).
 *
 * Returns a new `DocumentNode`; does not mutate `doc`. Returns the original
 * document unchanged when the path does not resolve to a field with a
 * selection set.
 */
export function createFragmentFromSelection(
  doc: DocumentNode,
  path: PathSegment[],
  fragmentName: string,
  typeName: string,
  operationName?: string,
): DocumentNode {
  // Resolve the target selection set before entering mapOperation so we can
  // bail early and avoid building the fragment def when the path is missing.
  const operation = findOperation(doc, operationName);
  if (!operation) {
    return doc;
  }

  const targetSelectionSet = findSelectionSet(operation.selectionSet, path);
  if (!targetSelectionSet || targetSelectionSet.selections.length === 0) {
    return doc;
  }

  const fragmentDef: FragmentDefinitionNode = {
    kind: Kind.FRAGMENT_DEFINITION,
    name: { kind: Kind.NAME, value: fragmentName },
    typeCondition: {
      kind: Kind.NAMED_TYPE,
      name: { kind: Kind.NAME, value: typeName },
    },
    directives: [],
    selectionSet: targetSelectionSet,
  };

  const spread: FragmentSpreadNode = {
    kind: Kind.FRAGMENT_SPREAD,
    name: { kind: Kind.NAME, value: fragmentName },
    directives: [],
  };

  const spreadSet: SelectionSetNode = {
    kind: Kind.SELECTION_SET,
    selections: [spread],
  };

  let changed = false;
  const updatedDoc = mapOperation(doc, operationName, op => {
    const newSelectionSet = replaceFieldSelectionSet(
      op.selectionSet,
      path,
      spreadSet,
    );
    if (newSelectionSet === op.selectionSet) {
      return op;
    }
    changed = true;
    return { ...op, selectionSet: newSelectionSet };
  });

  if (!changed) {
    return doc;
  }

  return {
    ...updatedDoc,
    definitions: [...updatedDoc.definitions, fragmentDef],
  };
}

/**
 * Renames the named fragment `oldName` to `newName`, updating the definition
 * and every `...oldName` spread across the document (operations and other
 * fragments alike). Returns the original document unchanged when no fragment
 * named `oldName` exists or when `newName` is empty or already taken.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function renameFragment(
  doc: DocumentNode,
  oldName: string,
  newName: string,
): DocumentNode {
  if (!newName || oldName === newName) {
    return doc;
  }
  const names = new Set(listFragments(doc));
  if (!names.has(oldName) || names.has(newName)) {
    return doc;
  }

  const rename = (node: { name: { value: string } }) => {
    if (node.name.value !== oldName) {
      return;
    }
    return { ...node, name: { ...node.name, value: newName } };
  };

  return visit(doc, {
    FragmentDefinition: rename,
    FragmentSpread: rename,
  });
}
