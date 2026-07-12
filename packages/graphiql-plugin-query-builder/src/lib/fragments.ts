import {
  Kind,
  visit,
  type DocumentNode,
  type FragmentDefinitionNode,
  type FragmentSpreadNode,
  type SelectionSetNode,
} from 'graphql';

import {
  findDefinition,
  findSelectionSet,
  mapDefinition,
  removeField,
  replaceFieldSelectionSet,
  type DefinitionTarget,
  type PathSegment,
} from './ast-path';
import { pruneUnusedVariableDefinitions } from './field-selection';

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
  target: DefinitionTarget,
): DocumentNode {
  // Resolve the target selection set before entering mapDefinition so we can
  // bail early and avoid building the fragment def when the path is missing.
  const definition = findDefinition(doc, target);
  if (!definition) {
    return doc;
  }

  const targetSelectionSet = findSelectionSet(definition.selectionSet, path);
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
  const updatedDoc = mapDefinition(doc, target, def => {
    const newSelectionSet = replaceFieldSelectionSet(
      def.selectionSet,
      path,
      spreadSet,
    );
    if (newSelectionSet === def.selectionSet) {
      return def;
    }
    changed = true;
    return { ...def, selectionSet: newSelectionSet };
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
 * Removes the `...fragmentName` spread from the selection set of the field at
 * `fieldPath` (or the definition root when `fieldPath` is empty) in the
 * definition addressed by `target`. If that leaves the field with no
 * selections, the field itself is pruned; if it empties an operation, the
 * operation is dropped.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`. Returns the original
 * document unchanged when no such spread is present.
 */
export function removeFragmentSpread(
  doc: DocumentNode,
  fieldPath: PathSegment[],
  fragmentName: string,
  target: DefinitionTarget,
): DocumentNode {
  return mapDefinition(doc, target, def => {
    const targetSet =
      fieldPath.length === 0
        ? def.selectionSet
        : findSelectionSet(def.selectionSet, fieldPath);
    if (!targetSet) {
      return def;
    }

    const remaining = targetSet.selections.filter(
      s => !(s.kind === Kind.FRAGMENT_SPREAD && s.name.value === fragmentName),
    );
    if (remaining.length === targetSet.selections.length) {
      return def;
    }

    let newSelectionSet: SelectionSetNode;
    if (fieldPath.length === 0) {
      newSelectionSet = { ...def.selectionSet, selections: remaining };
    } else if (remaining.length === 0) {
      // The spread was the field's only selection; drop the field too.
      newSelectionSet = removeField(def.selectionSet, fieldPath);
    } else {
      newSelectionSet = replaceFieldSelectionSet(def.selectionSet, fieldPath, {
        kind: Kind.SELECTION_SET,
        selections: remaining,
      });
    }

    if (newSelectionSet.selections.length === 0) {
      // An operation with no selection set is unprintable; a fragment can't be
      // emptied without orphaning its own spreads. Drop the operation; leave
      // the fragment intact.
      return def.kind === Kind.OPERATION_DEFINITION ? null : def;
    }
    if (def.kind === Kind.FRAGMENT_DEFINITION) {
      return { ...def, selectionSet: newSelectionSet };
    }
    // Removing the spread can orphan a variable a field inside it referenced.
    return pruneUnusedVariableDefinitions(
      { ...def, selectionSet: newSelectionSet },
      doc,
    );
  });
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
