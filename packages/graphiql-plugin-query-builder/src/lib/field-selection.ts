import {
  Kind,
  visit,
  type DocumentNode,
  type OperationDefinitionNode,
  type SelectionSetNode,
} from 'graphql';

import {
  addField,
  findNodeAtPath,
  findOperation,
  mapOperation,
  removeField,
  type PathSegment,
} from './ast-path';

/** Collects every variable name referenced anywhere within `selectionSet`. */
export function collectVariableReferences(
  selectionSet: SelectionSetNode,
  into: Set<string>,
): void {
  visit(selectionSet, {
    Variable(node) {
      into.add(node.name.value);
    },
  });
}

/**
 * Drops variable definitions that are no longer referenced by the operation,
 * so removing the last field that used a promoted variable doesn't leave a
 * dangling (invalid) `$var` in the operation header. Named fragments in `doc`
 * are scanned too, so a variable used only through a fragment spread is kept.
 */
export function pruneUnusedVariableDefinitions(
  operation: OperationDefinitionNode,
  doc: DocumentNode,
): OperationDefinitionNode {
  const varDefs = operation.variableDefinitions ?? [];
  if (varDefs.length === 0) {
    return operation;
  }

  const used = new Set<string>();
  collectVariableReferences(operation.selectionSet, used);
  for (const def of doc.definitions) {
    if (def.kind === Kind.FRAGMENT_DEFINITION) {
      collectVariableReferences(def.selectionSet, used);
    }
  }

  const kept = varDefs.filter(vd => used.has(vd.variable.name.value));
  if (kept.length === varDefs.length) {
    return operation;
  }
  return { ...operation, variableDefinitions: kept };
}

/**
 * Returns whether the field at the given path is present in the target
 * operation (by name, or the first operation when unspecified) of `doc`.
 */
export function isFieldSelected(
  doc: DocumentNode,
  path: PathSegment[],
  operationName?: string,
): boolean {
  if (path.length === 0) {
    return false;
  }

  const operation = findOperation(doc, operationName);
  if (!operation) {
    return false;
  }

  return findNodeAtPath(operation.selectionSet, path) !== undefined;
}

/**
 * Toggles the field at `path` in the target operation (by name, or the first
 * operation when unspecified) of `doc`:
 * - If the field is already selected, removes it (along with its children).
 * - If the field is not selected, adds it (creating intermediate selection
 *   sets as needed).
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function toggleFieldSelection(
  doc: DocumentNode,
  path: PathSegment[],
  operationName?: string,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  const selected = isFieldSelected(doc, path, operationName);
  return mapOperation(doc, operationName, operation => {
    const newSelectionSet = selected
      ? removeField(operation.selectionSet, path)
      : addField(operation.selectionSet, path);

    if (newSelectionSet.selections.length === 0) {
      // Removing the last field empties the operation. An operation with no
      // selection set is unprintable (it would fail to parse and leave the
      // builder out of sync), so drop the whole operation definition instead.
      return null;
    }

    let newOperation: OperationDefinitionNode = {
      ...operation,
      selectionSet: newSelectionSet,
    };
    // Removing a field can orphan a promoted variable; drop any now-unused
    // variable definitions so the operation stays valid.
    if (selected) {
      newOperation = pruneUnusedVariableDefinitions(newOperation, doc);
    }
    return newOperation;
  });
}
