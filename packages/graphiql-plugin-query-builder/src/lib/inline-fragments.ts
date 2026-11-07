import {
  Kind,
  type DocumentNode,
  type InlineFragmentNode,
  type SelectionSetNode,
} from 'graphql';

import {
  addField,
  fieldSegment,
  findNodeAtPath,
  findDefinition,
  inlineFragmentSegment,
  mapDefinition,
  removeField,
  type DefinitionTarget,
  type PathSegment,
} from './ast-path';
import { pruneUnusedVariableDefinitions } from './field-selection';

function findFieldSelectionSet(
  doc: DocumentNode,
  path: PathSegment[],
  target: DefinitionTarget,
): SelectionSetNode | undefined {
  const definition = findDefinition(doc, target);
  if (!definition) {
    return undefined;
  }

  if (path.length === 0) {
    return definition.selectionSet;
  }

  const node = findNodeAtPath(definition.selectionSet, path);
  return node?.selectionSet;
}

/**
 * Returns `true` when the field at `path` in the definition addressed by
 * `target` (an operation or a named fragment) of `doc` already contains an
 * `... on TypeName` inline fragment with the given `typeName`.
 */
export function isInlineFragmentPresent(
  doc: DocumentNode,
  path: PathSegment[],
  typeName: string,
  target: DefinitionTarget,
): boolean {
  const selectionSet = findFieldSelectionSet(doc, path, target);
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
 * `path` in the definition addressed by `target` (an operation or a named
 * fragment) of `doc`. If the fragment is already present this is a no-op.
 *
 * Creates the field's selection set when the field currently has none.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function addInlineFragment(
  doc: DocumentNode,
  path: PathSegment[],
  typeName: string,
  target: DefinitionTarget,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  if (isInlineFragmentPresent(doc, path, typeName, target)) {
    return doc;
  }

  // Add `... on TypeName { __typename }` by treating the fragment as an
  // addressable path segment and seeding it with __typename. addField creates
  // the parent field(s) when absent, so this works even with no prior
  // selection on the abstract field.
  const fragmentPath = [
    ...path,
    inlineFragmentSegment(typeName),
    fieldSegment('__typename'),
  ];
  return mapDefinition(doc, target, definition => ({
    ...definition,
    selectionSet: addField(definition.selectionSet, fragmentPath),
  }));
}

/**
 * Removes the `... on TypeName` inline fragment from the field at `path` in
 * the definition addressed by `target` (an operation or a named fragment) of
 * `doc`. If no such fragment exists this is a no-op.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function removeInlineFragment(
  doc: DocumentNode,
  path: PathSegment[],
  typeName: string,
  target: DefinitionTarget,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  // Remove the entire inline fragment by treating it as a leaf path segment.
  const fragmentPath = [...path, inlineFragmentSegment(typeName)];
  return mapDefinition(doc, target, definition => {
    const newSelectionSet = removeField(definition.selectionSet, fragmentPath);
    if (newSelectionSet === definition.selectionSet) {
      return definition;
    }

    if (newSelectionSet.selections.length === 0) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        // Removing the fragment emptied the operation; drop it (an operation
        // with no selection set is unprintable).
        return null;
      }
      // Emptying a named fragment would orphan its spreads; keep it intact.
      return definition;
    }

    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      return { ...definition, selectionSet: newSelectionSet };
    }

    // Dropping the fragment can orphan a variable a field inside it used.
    return pruneUnusedVariableDefinitions(
      { ...definition, selectionSet: newSelectionSet },
      doc,
    );
  });
}
