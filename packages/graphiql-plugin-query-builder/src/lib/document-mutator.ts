import {
  GraphQLEnumType,
  Kind,
  type ArgumentNode,
  type DocumentNode,
  type FieldNode,
  type GraphQLScalarType,
  type ListValueNode,
  type ObjectFieldNode,
  type ObjectValueNode,
  type SelectionSetNode,
  type ValueNode,
} from 'graphql';

/**
 * Returns whether the field at the given path is present in the first
 * operation definition of `doc`. Path elements are field names, e.g.
 * `['hero', 'name']` for `{ hero { name } }`.
 */
export function isFieldSelected(doc: DocumentNode, path: string[]): boolean {
  if (path.length === 0) return false;

  const operation = doc.definitions.find(
    d => d.kind === Kind.OPERATION_DEFINITION,
  );
  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION) return false;

  let selectionSet: SelectionSetNode | undefined = operation.selectionSet;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i]!;
    if (!selectionSet) return false;
    const field: FieldNode | undefined = selectionSet.selections.find(
      (s): s is FieldNode => s.kind === Kind.FIELD && s.name.value === segment,
    );
    if (!field) return false;
    if (i === path.length - 1) return true;
    selectionSet = field.selectionSet;
  }

  return false;
}

/**
 * Toggles the field at `path` in the first operation definition of `doc`:
 * - If the field is already selected, removes it (along with its children).
 * - If the field is not selected, adds it (creating intermediate selection
 *   sets as needed).
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function toggleFieldSelection(
  doc: DocumentNode,
  path: string[],
): DocumentNode {
  if (path.length === 0) return doc;

  const operationIndex = doc.definitions.findIndex(
    d => d.kind === Kind.OPERATION_DEFINITION,
  );
  if (operationIndex === -1) return doc;

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) return doc;

  const selected = isFieldSelected(doc, path);
  const newSelectionSet = selected
    ? removeField(operation.selectionSet, path)
    : addField(operation.selectionSet, path);

  const newOperation = { ...operation, selectionSet: newSelectionSet };
  const newDefinitions = [...doc.definitions];
  newDefinitions[operationIndex] = newOperation;

  return { ...doc, definitions: newDefinitions };
}

// ---------------------------------------------------------------------------
// Argument helpers
// ---------------------------------------------------------------------------

/**
 * Converts a raw string value to the appropriate GraphQL `ValueNode` based on
 * the scalar or enum type. Returns `undefined` when `raw` is empty, which
 * callers treat as "unset this argument".
 */
export function scalarToValueNode(
  type: GraphQLScalarType | GraphQLEnumType,
  raw: string,
): ValueNode | undefined {
  if (raw === '') return undefined;
  if (type instanceof GraphQLEnumType) {
    return { kind: Kind.ENUM, value: raw };
  }
  switch (type.name) {
    case 'Int':
      return { kind: Kind.INT, value: raw };
    case 'Float':
      return { kind: Kind.FLOAT, value: raw };
    case 'Boolean':
      return { kind: Kind.BOOLEAN, value: raw === 'true' };
    case 'String':
    case 'ID':
      return { kind: Kind.STRING, value: raw };
    default:
      return { kind: Kind.STRING, value: raw };
  }
}

/**
 * Returns a map of argument name → raw string value for the field at `path`
 * in the first operation definition of `doc`. Values are extracted from the
 * AST and converted to a printable string form. Arguments that are not present
 * in the doc are omitted from the returned object.
 */
export function getFieldArgValues(
  doc: DocumentNode,
  path: string[],
): Record<string, string> {
  if (path.length === 0) return {};

  const operation = doc.definitions.find(
    d => d.kind === Kind.OPERATION_DEFINITION,
  );
  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION) return {};

  let selectionSet: SelectionSetNode | undefined = operation.selectionSet;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i]!;
    if (!selectionSet) return {};
    const field: FieldNode | undefined = selectionSet.selections.find(
      (s): s is FieldNode => s.kind === Kind.FIELD && s.name.value === segment,
    );
    if (!field) return {};
    if (i === path.length - 1) {
      const result: Record<string, string> = {};
      for (const arg of field.arguments ?? []) {
        result[arg.name.value] = valueNodeToString(arg.value);
      }
      return result;
    }
    selectionSet = field.selectionSet;
  }

  return {};
}

// ---------------------------------------------------------------------------
// List and input-object value helpers
// ---------------------------------------------------------------------------

/**
 * Converts a plain JavaScript value to a GraphQL `ValueNode`. Handles strings,
 * numbers, booleans, arrays, and plain objects (for input types). Primitives
 * that don't match a known type fall back to a `StringValue`.
 */
export function jsValueToValueNode(value: unknown): ValueNode {
  if (Array.isArray(value)) {
    const node: ListValueNode = {
      kind: Kind.LIST,
      values: value.map(jsValueToValueNode),
    };
    return node;
  }
  if (value !== null && typeof value === 'object') {
    const fields: ObjectFieldNode[] = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => ({
        kind: Kind.OBJECT_FIELD as const,
        name: { kind: Kind.NAME as const, value: k },
        value: jsValueToValueNode(v),
      }),
    );
    const node: ObjectValueNode = { kind: Kind.OBJECT, fields };
    return node;
  }
  if (typeof value === 'boolean') {
    return { kind: Kind.BOOLEAN, value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { kind: Kind.INT, value: String(value) };
    }
    return { kind: Kind.FLOAT, value: String(value) };
  }
  // Fallthrough: treat as string
  return { kind: Kind.STRING, value: String(value ?? '') };
}

/**
 * Sets a list-valued argument on the field at `path`. Each element of `items`
 * is converted to a `ValueNode` via `jsValueToValueNode`, so items may be
 * scalars, plain objects (for input types), or nested arrays.
 *
 * Pass `undefined` to remove the argument entirely.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function setListArgValue(
  doc: DocumentNode,
  path: string[],
  argName: string,
  items: unknown[] | undefined,
): DocumentNode {
  if (items === undefined) {
    return setFieldArgument(doc, path, argName, undefined);
  }
  const listNode: ListValueNode = {
    kind: Kind.LIST,
    values: items.map(jsValueToValueNode),
  };
  return setFieldArgument(doc, path, argName, listNode);
}

/**
 * Sets an input-object-valued argument on the field at `path`. The `obj`
 * record's values are converted to `ValueNode`s via `jsValueToValueNode`.
 *
 * Pass `undefined` to remove the argument entirely.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function setInputObjectArgValue(
  doc: DocumentNode,
  path: string[],
  argName: string,
  obj: Record<string, unknown> | undefined,
): DocumentNode {
  if (obj === undefined) {
    return setFieldArgument(doc, path, argName, undefined);
  }
  const fields: ObjectFieldNode[] = Object.entries(obj).map(([k, v]) => ({
    kind: Kind.OBJECT_FIELD as const,
    name: { kind: Kind.NAME as const, value: k },
    value: jsValueToValueNode(v),
  }));
  const objectNode: ObjectValueNode = { kind: Kind.OBJECT, fields };
  return setFieldArgument(doc, path, argName, objectNode);
}

function valueNodeToString(node: ValueNode): string {
  switch (node.kind) {
    case Kind.INT:
    case Kind.FLOAT:
    case Kind.STRING:
    case Kind.ENUM:
      return node.value;
    case Kind.BOOLEAN:
      return node.value ? 'true' : 'false';
    default:
      return '';
  }
}

/**
 * Sets or removes a named argument on the field located at `path` within the
 * first operation definition of `doc`. When `value` is `undefined` the
 * argument is removed; otherwise it is added or updated in place.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function setFieldArgument(
  doc: DocumentNode,
  path: string[],
  argName: string,
  value: ValueNode | undefined,
): DocumentNode {
  if (path.length === 0) return doc;

  const operationIndex = doc.definitions.findIndex(
    d => d.kind === Kind.OPERATION_DEFINITION,
  );
  if (operationIndex === -1) return doc;

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) return doc;

  const newSelectionSet = setArgInSelectionSet(
    operation.selectionSet,
    path,
    argName,
    value,
  );
  if (newSelectionSet === operation.selectionSet) return doc;

  const newOperation = { ...operation, selectionSet: newSelectionSet };
  const newDefinitions = [...doc.definitions];
  newDefinitions[operationIndex] = newOperation;
  return { ...doc, definitions: newDefinitions };
}

function setArgInSelectionSet(
  selectionSet: SelectionSetNode,
  path: string[],
  argName: string,
  value: ValueNode | undefined,
): SelectionSetNode {
  const [segment, ...rest] = path as [string, ...string[]];
  const fieldIndex = selectionSet.selections.findIndex(
    (s): s is FieldNode => s.kind === Kind.FIELD && s.name.value === segment,
  );
  if (fieldIndex === -1) return selectionSet; // field not found — nothing to do

  const field = selectionSet.selections[fieldIndex] as FieldNode;

  let updatedField: FieldNode;
  if (rest.length === 0) {
    // We're at the target field — update its arguments.
    const existingArgs: readonly ArgumentNode[] = field.arguments ?? [];
    let newArgs: ArgumentNode[];
    if (value === undefined) {
      newArgs = existingArgs.filter(a => a.name.value !== argName);
    } else {
      const existingIndex = existingArgs.findIndex(a => a.name.value === argName);
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
    updatedField = { ...field, arguments: newArgs };
  } else {
    // Descend into the child selection set.
    if (!field.selectionSet) return selectionSet;
    const newChildSet = setArgInSelectionSet(field.selectionSet, rest, argName, value);
    if (newChildSet === field.selectionSet) return selectionSet;
    updatedField = { ...field, selectionSet: newChildSet };
  }

  const newSelections = [...selectionSet.selections];
  newSelections[fieldIndex] = updatedField;
  return { ...selectionSet, selections: newSelections };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addField(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode {
  const [segment, ...rest] = path as [string, ...string[]];

  if (rest.length === 0) {
    // Leaf — add the field if not already present.
    const alreadyPresent = selectionSet.selections.some(
      (s): s is FieldNode => s.kind === Kind.FIELD && s.name.value === segment,
    );
    if (alreadyPresent) return selectionSet;

    const newField: FieldNode = {
      kind: Kind.FIELD,
      name: { kind: Kind.NAME, value: segment },
      arguments: [],
      directives: [],
      selectionSet: undefined,
    };
    return {
      ...selectionSet,
      selections: [...selectionSet.selections, newField],
    };
  }

  // Non-leaf — descend into the child field (creating it if necessary).
  const existingIndex = selectionSet.selections.findIndex(
    (s): s is FieldNode => s.kind === Kind.FIELD && s.name.value === segment,
  );

  if (existingIndex === -1) {
    // Parent doesn't exist yet — create it with an empty selection set, then
    // recurse to add the child.
    const emptySet: SelectionSetNode = {
      kind: Kind.SELECTION_SET,
      selections: [],
    };
    const parentField: FieldNode = {
      kind: Kind.FIELD,
      name: { kind: Kind.NAME, value: segment },
      arguments: [],
      directives: [],
      selectionSet: addField(emptySet, rest),
    };
    return {
      ...selectionSet,
      selections: [...selectionSet.selections, parentField],
    };
  }

  const existing = selectionSet.selections[existingIndex] as FieldNode;
  const childSet: SelectionSetNode = existing.selectionSet ?? {
    kind: Kind.SELECTION_SET,
    selections: [],
  };
  const updatedChild: FieldNode = {
    ...existing,
    selectionSet: addField(childSet, rest),
  };
  const newSelections = [...selectionSet.selections];
  newSelections[existingIndex] = updatedChild;
  return { ...selectionSet, selections: newSelections };
}

function removeField(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode {
  const [segment, ...rest] = path as [string, ...string[]];

  if (rest.length === 0) {
    // Leaf — remove the field entirely (children go with it).
    return {
      ...selectionSet,
      selections: selectionSet.selections.filter(
        s => !(s.kind === Kind.FIELD && s.name.value === segment),
      ),
    };
  }

  // Non-leaf — recurse into the parent field.
  const parentIndex = selectionSet.selections.findIndex(
    (s): s is FieldNode => s.kind === Kind.FIELD && s.name.value === segment,
  );
  if (parentIndex === -1) return selectionSet; // nothing to remove

  const parent = selectionSet.selections[parentIndex] as FieldNode;
  if (!parent.selectionSet) return selectionSet;

  const updatedParent: FieldNode = {
    ...parent,
    selectionSet: removeField(parent.selectionSet, rest),
  };
  const newSelections = [...selectionSet.selections];
  newSelections[parentIndex] = updatedParent;
  return { ...selectionSet, selections: newSelections };
}
