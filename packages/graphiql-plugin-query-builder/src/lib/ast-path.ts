import {
  Kind,
  type ArgumentNode,
  type DocumentNode,
  type FieldNode,
  type InlineFragmentNode,
  type OperationDefinitionNode,
  type SelectionNode,
  type SelectionSetNode,
  type ValueNode,
} from 'graphql';

export const INLINE_FRAGMENT_PREFIX = '... on ';

/** Builds the path segment that addresses the `... on TypeName` inline fragment. */
export function inlineFragmentSegment(typeName: string): string {
  return `${INLINE_FRAGMENT_PREFIX}${typeName}`;
}

export function isInlineFragmentSegment(segment: string): boolean {
  return segment.startsWith(INLINE_FRAGMENT_PREFIX);
}

/**
 * True when `selection` is the field or inline fragment named by `segment`.
 *
 * Fields are matched by schema name, not response key: the builder's tree is
 * driven by the schema, so a path segment is a field name and never carries an
 * alias. A document the user hand-aliased (`a: hero b: hero`) therefore matches
 * the first selection with that name. Helpers that walk to a single node act
 * on that first match only (see `mapNodeAtPath`), so unchecking an aliased
 * field removes one occurrence rather than wiping every alias of it. Full
 * alias-aware editing would require a selection-driven tree and is out of scope.
 */
export function selectionMatchesSegment(
  selection: SelectionNode,
  segment: string,
): boolean {
  if (isInlineFragmentSegment(segment)) {
    const typeName = segment.slice(INLINE_FRAGMENT_PREFIX.length);
    return (
      selection.kind === Kind.INLINE_FRAGMENT &&
      selection.typeCondition?.name.value === typeName
    );
  }
  return selection.kind === Kind.FIELD && selection.name.value === segment;
}

/**
 * Walks `path` through `selectionSet` via `selectionMatchesSegment` and
 * returns the node at the final segment, or `undefined` if any segment is
 * missing.
 */
export function findNodeAtPath(
  selectionSet: SelectionSetNode,
  path: string[],
): FieldNode | InlineFragmentNode | undefined {
  let current: SelectionSetNode = selectionSet;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i]!;
    const node = current.selections.find(s =>
      selectionMatchesSegment(s, segment),
    ) as FieldNode | InlineFragmentNode | undefined;
    if (!node) {
      return undefined;
    }
    if (i === path.length - 1) {
      return node;
    }
    if (!node.selectionSet) {
      return undefined;
    }
    current = node.selectionSet;
  }
  return undefined;
}

/**
 * Immutably rebuilds `selectionSet`, descending to the node at `path` via
 * `selectionMatchesSegment`, then applying `fn` to it. `fn` returns the
 * replacement node, or `undefined` to delete it. When `pruneEmptyParent` is
 * true (default), a non-leaf ancestor whose child selection set becomes empty
 * after the operation is itself pruned. Returns the original `selectionSet`
 * reference unchanged when `path` does not resolve.
 */
export function mapNodeAtPath(
  selectionSet: SelectionSetNode,
  path: string[],
  fn: (
    node: FieldNode | InlineFragmentNode,
  ) => FieldNode | InlineFragmentNode | null,
  pruneEmptyParent = true,
): SelectionSetNode {
  const [segment, ...rest] = path as [string, ...string[]];
  const nodeIndex = selectionSet.selections.findIndex(s =>
    selectionMatchesSegment(s, segment),
  );
  if (nodeIndex === -1) {
    return selectionSet;
  }

  const node = selectionSet.selections[nodeIndex] as
    | FieldNode
    | InlineFragmentNode;

  if (rest.length === 0) {
    const replacement = fn(node);
    const newSelections = [...selectionSet.selections];
    if (replacement === null) {
      newSelections.splice(nodeIndex, 1);
    } else {
      newSelections[nodeIndex] = replacement;
    }
    return { ...selectionSet, selections: newSelections };
  }

  if (!node.selectionSet) {
    return selectionSet;
  }
  const newChildSet = mapNodeAtPath(
    node.selectionSet,
    rest,
    fn,
    pruneEmptyParent,
  );
  if (newChildSet === node.selectionSet) {
    return selectionSet;
  }

  if (pruneEmptyParent && newChildSet.selections.length === 0) {
    const newSelections = selectionSet.selections.filter(
      (_, i) => i !== nodeIndex,
    );
    return { ...selectionSet, selections: newSelections };
  }

  const updated = { ...node, selectionSet: newChildSet } as
    | FieldNode
    | InlineFragmentNode;
  const newSelections = [...selectionSet.selections];
  newSelections[nodeIndex] = updated;
  return { ...selectionSet, selections: newSelections };
}

/** Creates the field or inline fragment for `segment`, with the given child set. */
export function createSelectionForSegment(
  segment: string,
  selectionSet?: SelectionSetNode,
): FieldNode | InlineFragmentNode {
  if (isInlineFragmentSegment(segment)) {
    return {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: segment.slice(INLINE_FRAGMENT_PREFIX.length),
        },
      },
      directives: [],
      selectionSet: selectionSet ?? {
        kind: Kind.SELECTION_SET,
        selections: [],
      },
    };
  }
  return {
    kind: Kind.FIELD,
    name: { kind: Kind.NAME, value: segment },
    arguments: [],
    directives: [],
    selectionSet,
  };
}

export function addField(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode {
  const [segment, ...rest] = path as [string, ...string[]];

  if (rest.length === 0) {
    const alreadyPresent = selectionSet.selections.some(s =>
      selectionMatchesSegment(s, segment),
    );
    if (alreadyPresent) {
      return selectionSet;
    }

    const newNode = createSelectionForSegment(segment);
    return {
      ...selectionSet,
      selections: [...selectionSet.selections, newNode],
    };
  }

  const existingIndex = selectionSet.selections.findIndex(s =>
    selectionMatchesSegment(s, segment),
  );

  if (existingIndex === -1) {
    // Parent node doesn't exist yet; create it and recurse to add the child.
    const emptySet: SelectionSetNode = {
      kind: Kind.SELECTION_SET,
      selections: [],
    };
    const parentNode = createSelectionForSegment(
      segment,
      addField(emptySet, rest),
    );
    return {
      ...selectionSet,
      selections: [...selectionSet.selections, parentNode],
    };
  }

  const existing = selectionSet.selections[existingIndex] as
    | FieldNode
    | InlineFragmentNode;
  const childSet: SelectionSetNode = existing.selectionSet ?? {
    kind: Kind.SELECTION_SET,
    selections: [],
  };
  const updated = {
    ...existing,
    selectionSet: addField(childSet, rest),
  } as FieldNode | InlineFragmentNode;
  const newSelections = [...selectionSet.selections];
  newSelections[existingIndex] = updated;
  return { ...selectionSet, selections: newSelections };
}

export function removeField(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode {
  // Delete the terminal node (fn returns null); pruneEmptyParent=true
  // ensures any ancestor whose child set became empty is also pruned.
  return mapNodeAtPath(selectionSet, path, () => null, true);
}

export function replaceFieldSelectionSet(
  selectionSet: SelectionSetNode,
  path: string[],
  newSet: SelectionSetNode,
): SelectionSetNode {
  return mapNodeAtPath(
    selectionSet,
    path,
    node =>
      ({ ...node, selectionSet: newSet }) as FieldNode | InlineFragmentNode,
    false,
  );
}

export function setArgInSelectionSet(
  selectionSet: SelectionSetNode,
  path: string[],
  argName: string,
  value: ValueNode | undefined,
): SelectionSetNode {
  return mapNodeAtPath(
    selectionSet,
    path,
    node => {
      // Arguments live on fields, not inline fragments.
      const field = node as FieldNode;
      const existingArgs: readonly ArgumentNode[] = field.arguments ?? [];
      let newArgs: ArgumentNode[];
      if (value === undefined) {
        newArgs = existingArgs.filter(a => a.name.value !== argName);
      } else {
        const existingIndex = existingArgs.findIndex(
          a => a.name.value === argName,
        );
        const newArg: ArgumentNode = {
          kind: Kind.ARGUMENT,
          name: { kind: Kind.NAME, value: argName },
          value,
        };
        if (existingIndex === -1) {
          newArgs = [...existingArgs, newArg];
        } else {
          newArgs = [...existingArgs];
          newArgs[existingIndex] = newArg;
        }
      }
      return { ...field, arguments: newArgs };
    },
    false, // do not prune empty parents when setting args
  );
}

export function findSelectionSet(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode | undefined {
  const node = findNodeAtPath(selectionSet, path);
  return node?.selectionSet;
}

/**
 * Returns the index in `doc.definitions` of the operation to operate on:
 * the operation whose name matches `operationName` when given and present,
 * otherwise the first operation definition. Returns -1 when the document has
 * no operation definitions.
 */
export function findOperationIndex(
  doc: DocumentNode,
  operationName?: string,
): number {
  if (operationName) {
    const named = doc.definitions.findIndex(
      d =>
        d.kind === Kind.OPERATION_DEFINITION && d.name?.value === operationName,
    );
    if (named !== -1) {
      return named;
    }
  }
  return doc.definitions.findIndex(d => d.kind === Kind.OPERATION_DEFINITION);
}

/**
 * Resolves the target operation node (see {@link findOperationIndex}), or
 * `undefined` when the document has no matching operation.
 */
export function findOperation(
  doc: DocumentNode,
  operationName?: string,
): OperationDefinitionNode | undefined {
  const index = findOperationIndex(doc, operationName);
  if (index === -1) {
    return undefined;
  }
  const operation = doc.definitions[index];
  return operation?.kind === Kind.OPERATION_DEFINITION ? operation : undefined;
}

/**
 * Finds the target operation, calls `fn` with it, and returns a new
 * `DocumentNode` with the result spliced back into `definitions`. When `fn`
 * returns `null` the operation is removed entirely (used when an operation
 * becomes empty and unprintable). Returns `doc` unchanged when no matching
 * operation definition exists.
 */
export function mapOperation(
  doc: DocumentNode,
  operationName: string | undefined,
  fn: (operation: OperationDefinitionNode) => OperationDefinitionNode | null,
): DocumentNode {
  const index = findOperationIndex(doc, operationName);
  if (index === -1) {
    return doc;
  }
  const def = doc.definitions[index];
  if (def?.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }
  const result = fn(def);
  // When fn returns the same reference, the operation is unchanged — return
  // the original doc so callers that rely on reference equality for no-op
  // detection (e.g. toBe checks) continue to work.
  if (result === def) {
    return doc;
  }
  const newDefinitions = [...doc.definitions];
  if (result === null) {
    newDefinitions.splice(index, 1);
  } else {
    newDefinitions[index] = result;
  }
  return { ...doc, definitions: newDefinitions };
}
