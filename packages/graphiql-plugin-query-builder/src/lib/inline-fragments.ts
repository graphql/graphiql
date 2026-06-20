import {
  Kind,
  type DocumentNode,
  type InlineFragmentNode,
  type SelectionSetNode,
} from 'graphql';

import {
  addField,
  findNodeAtPath,
  findOperation,
  inlineFragmentSegment,
  mapOperation,
  removeField,
} from './ast-path';
import { pruneUnusedVariableDefinitions } from './field-selection';

function findFieldSelectionSet(
  doc: DocumentNode,
  path: string[],
  operationName?: string,
): SelectionSetNode | undefined {
  const operation = findOperation(doc, operationName);
  if (!operation) {
    return undefined;
  }

  if (path.length === 0) {
    return operation.selectionSet;
  }

  const node = findNodeAtPath(operation.selectionSet, path);
  return node?.selectionSet;
}

/**
 * Returns `true` when the field at `path` in the target operation (by name,
 * or the first operation when unspecified) of `doc` already contains an
 * `... on TypeName` inline fragment with the given `typeName`.
 */
export function isInlineFragmentPresent(
  doc: DocumentNode,
  path: string[],
  typeName: string,
  operationName?: string,
): boolean {
  const selectionSet = findFieldSelectionSet(doc, path, operationName);
  if (!selectionSet) {
    return false;
  }
  return selectionSet.selections.some(
    (s): s is InlineFragmentNode =>
      s.kind === Kind.INLINE_FRAGMENT &&
      s.typeCondition?.name.value === typeName,
  );
}

/**
 * Adds an `... on TypeName { __typename }` inline fragment to the field at
 * `path` in the target operation (by name, or the first operation when
 * unspecified) of `doc`. If the fragment is already present this is a no-op.
 *
 * Creates the field's selection set when the field currently has none.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function addInlineFragment(
  doc: DocumentNode,
  path: string[],
  typeName: string,
  operationName?: string,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  if (isInlineFragmentPresent(doc, path, typeName, operationName)) {
    return doc;
  }

  // Add `... on TypeName { __typename }` by treating the fragment as an
  // addressable path segment and seeding it with __typename. addField creates
  // the parent field(s) when absent, so this works even with no prior
  // selection on the abstract field.
  const fragmentPath = [...path, inlineFragmentSegment(typeName), '__typename'];
  return mapOperation(doc, operationName, operation => ({
    ...operation,
    selectionSet: addField(operation.selectionSet, fragmentPath),
  }));
}

/**
 * Removes the `... on TypeName` inline fragment from the field at `path` in
 * the target operation (by name, or the first operation when unspecified) of
 * `doc`. If no such fragment exists this is a no-op.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function removeInlineFragment(
  doc: DocumentNode,
  path: string[],
  typeName: string,
  operationName?: string,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  // Remove the entire inline fragment by treating it as a leaf path segment.
  const fragmentPath = [...path, inlineFragmentSegment(typeName)];
  return mapOperation(doc, operationName, operation => {
    const newSelectionSet = removeField(operation.selectionSet, fragmentPath);
    if (newSelectionSet === operation.selectionSet) {
      return operation;
    }

    if (newSelectionSet.selections.length === 0) {
      // Removing the fragment emptied the operation; drop it (an operation with
      // no selection set is unprintable).
      return null;
    }

    // Dropping the fragment can orphan a variable a field inside it used.
    return pruneUnusedVariableDefinitions(
      { ...operation, selectionSet: newSelectionSet },
      doc,
    );
  });
}
