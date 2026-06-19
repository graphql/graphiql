import {
  GraphQLEnumType,
  Kind,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
  type ArgumentNode,
  type ConstValueNode,
  type DocumentNode,
  type FieldNode,
  type FragmentDefinitionNode,
  type FragmentSpreadNode,
  type GraphQLInputType,
  type GraphQLScalarType,
  type InlineFragmentNode,
  type ListValueNode,
  type ObjectFieldNode,
  type ObjectValueNode,
  type OperationDefinitionNode,
  type SelectionNode,
  type SelectionSetNode,
  type ValueNode,
  type VariableDefinitionNode,
} from 'graphql';

/**
 * A recursive value type for GraphQL input arguments. Leaves are always
 * strings (the raw unquoted text the user typed); lists and input objects
 * are represented as arrays and plain objects respectively.
 */
export type ArgValue = string | ArgValue[] | { [field: string]: ArgValue };

/**
 * Returns the index in `doc.definitions` of the operation to operate on:
 * the operation whose name matches `operationName` when given and present,
 * otherwise the first operation definition. Returns -1 when the document has
 * no operation definitions.
 */
function findOperationIndex(doc: DocumentNode, operationName?: string): number {
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

const INLINE_FRAGMENT_PREFIX = '... on ';

/** Builds the path segment that addresses the `... on TypeName` inline fragment. */
export function inlineFragmentSegment(typeName: string): string {
  return `${INLINE_FRAGMENT_PREFIX}${typeName}`;
}

function isInlineFragmentSegment(segment: string): boolean {
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
function selectionMatchesSegment(
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
function findNodeAtPath(
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
function mapNodeAtPath(
  selectionSet: SelectionSetNode,
  path: string[],
  // Returns the replacement node, or `null` to delete the node at `path`.
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
    // Terminal — apply fn.
    const replacement = fn(node);
    const newSelections = [...selectionSet.selections];
    if (replacement === null) {
      newSelections.splice(nodeIndex, 1);
    } else {
      newSelections[nodeIndex] = replacement;
    }
    return { ...selectionSet, selections: newSelections };
  }

  // Non-terminal — recurse.
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

  // Prune this node when its child set became empty (removeField behavior).
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
function createSelectionForSegment(
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

/**
 * Returns whether the field at the given path is present in the target
 * operation (by name, or the first operation when unspecified) of `doc`.
 * Path elements are field names, e.g. `['hero', 'name']` for `{ hero { name } }`.
 */
export function isFieldSelected(
  doc: DocumentNode,
  path: string[],
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

/** Collects every variable name referenced by an argument value. */
function collectVariablesInValue(value: ValueNode, into: Set<string>): void {
  switch (value.kind) {
    case Kind.VARIABLE:
      into.add(value.name.value);
      break;
    case Kind.LIST:
      for (const item of value.values) {
        collectVariablesInValue(item, into);
      }
      break;
    case Kind.OBJECT:
      for (const field of value.fields) {
        collectVariablesInValue(field.value, into);
      }
      break;
    default:
      break;
  }
}

/** Collects every variable name referenced anywhere within `selectionSet`. */
function collectVariableReferences(
  selectionSet: SelectionSetNode,
  into: Set<string>,
): void {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      for (const arg of selection.arguments ?? []) {
        collectVariablesInValue(arg.value, into);
      }
    }
    if ('selectionSet' in selection && selection.selectionSet) {
      collectVariableReferences(selection.selectionSet, into);
    }
  }
}

/**
 * Drops variable definitions that are no longer referenced by the operation,
 * so removing the last field that used a promoted variable doesn't leave a
 * dangling (invalid) `$var` in the operation header. Named fragments in `doc`
 * are scanned too, so a variable used only through a fragment spread is kept.
 */
function pruneUnusedVariableDefinitions(
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
  path: string[],
  operationName?: string,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  const selected = isFieldSelected(doc, path, operationName);
  const newSelectionSet = selected
    ? removeField(operation.selectionSet, path)
    : addField(operation.selectionSet, path);

  const newDefinitions = [...doc.definitions];
  if (newSelectionSet.selections.length === 0) {
    // Removing the last field empties the operation. An operation with no
    // selection set is unprintable (it would fail to parse and leave the
    // builder out of sync), so drop the whole operation definition instead.
    newDefinitions.splice(operationIndex, 1);
  } else {
    let newOperation: OperationDefinitionNode = {
      ...operation,
      selectionSet: newSelectionSet,
    };
    // Removing a field can orphan a promoted variable; drop any now-unused
    // variable definitions so the operation stays valid.
    if (selected) {
      newOperation = pruneUnusedVariableDefinitions(newOperation, doc);
    }
    newDefinitions[operationIndex] = newOperation;
  }

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
  if (raw === '') {
    return undefined;
  }
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
 * Returns a map of argument name → variable name for arguments at `path` that
 * are currently bound to a variable (i.e., the argument value is a
 * `Variable` node). Only includes args that are variable-bound; literal-valued
 * args are omitted.
 */
export function getFieldArgVariables(
  doc: DocumentNode,
  path: string[],
  operationName?: string,
): Record<string, string> {
  if (path.length === 0) {
    return {};
  }

  const operation = findOperation(doc, operationName);
  if (!operation) {
    return {};
  }

  const node = findNodeAtPath(operation.selectionSet, path);
  if (!node) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const arg of (node as FieldNode).arguments ?? []) {
    if (arg.value.kind === Kind.VARIABLE) {
      result[arg.name.value] = arg.value.name.value;
    }
  }
  return result;
}

/**
 * Returns a map of argument name → `ArgValue` for the field at `path`
 * in the target operation (by name, or the first operation when unspecified)
 * of `doc`. Values are extracted from the AST and converted to `ArgValue`
 * (leaves become strings; lists and input objects become arrays and plain
 * objects). Arguments not present in the doc are omitted from the returned
 * object.
 */
export function getFieldArgValues(
  doc: DocumentNode,
  path: string[],
  operationName?: string,
): Record<string, ArgValue> {
  if (path.length === 0) {
    return {};
  }

  const operation = findOperation(doc, operationName);
  if (!operation) {
    return {};
  }

  const node = findNodeAtPath(operation.selectionSet, path);
  if (!node) {
    return {};
  }

  const result: Record<string, ArgValue> = {};
  for (const arg of (node as FieldNode).arguments ?? []) {
    result[arg.name.value] = valueNodeToArgValue(arg.value);
  }
  return result;
}

/**
 * Converts a `ValueNode` from the AST into an `ArgValue`. List nodes become
 * arrays, object nodes become plain objects, and all scalar/enum/boolean
 * leaves become strings (preserving the same representation that `ArgInput`
 * leaf controls use so the read→write round-trip is stable).
 *
 * Note the `''` sentinel: an empty string is how the builder represents "this
 * argument is absent" (`argValueToValueNode` drops empty leaves). A `NullValue`
 * therefore collapses to `''`, which means an explicit `arg: null` is not
 * round-trip preserved: the builder has no UI affordance for null, so it reads
 * as empty and is dropped on the next write. Distinguishing explicit null from
 * absent would need a dedicated sentinel and a control to set it.
 */
export function valueNodeToArgValue(node: ValueNode): ArgValue {
  switch (node.kind) {
    case Kind.LIST:
      return node.values.map(valueNodeToArgValue);
    case Kind.OBJECT: {
      const obj: { [field: string]: ArgValue } = {};
      for (const f of node.fields) {
        obj[f.name.value] = valueNodeToArgValue(f.value);
      }
      return obj;
    }
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
 * Converts an `ArgValue` to the appropriate GraphQL `ValueNode`, guided by
 * the schema type so that Int items become `IntValue`, enum items become
 * `EnumValue`, etc. Returns `undefined` for an empty scalar leaf (callers
 * treat that as "remove this argument").
 */
export function argValueToValueNode(
  type: GraphQLInputType,
  value: ArgValue,
): ValueNode | undefined {
  // Strip NonNull wrapper
  if (isNonNullType(type)) {
    return argValueToValueNode(type.ofType, value);
  }

  if (isListType(type)) {
    const items = Array.isArray(value) ? value : [];
    const values: ValueNode[] = [];
    for (const item of items) {
      const node = argValueToValueNode(type.ofType, item);
      if (node !== undefined) {
        values.push(node);
      }
    }
    if (values.length === 0) {
      return undefined;
    }
    const listNode: ListValueNode = { kind: Kind.LIST, values };
    return listNode;
  }

  if (isInputObjectType(type)) {
    const obj =
      !Array.isArray(value) && typeof value === 'object' && value !== null
        ? (value as { [field: string]: ArgValue })
        : {};
    const fields = type.getFields();
    const objectFields: ObjectFieldNode[] = [];
    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      const fieldVal = obj[fieldName];
      if (fieldVal === undefined) {
        continue;
      }
      const fieldNode = argValueToValueNode(fieldDef.type, fieldVal);
      if (fieldNode === undefined) {
        continue;
      }
      objectFields.push({
        kind: Kind.OBJECT_FIELD as const,
        name: { kind: Kind.NAME as const, value: fieldName },
        value: fieldNode,
      });
    }
    if (objectFields.length === 0) {
      return undefined;
    }
    const objectNode: ObjectValueNode = {
      kind: Kind.OBJECT,
      fields: objectFields,
    };
    return objectNode;
  }

  // Scalar or enum leaf
  if (isEnumType(type) || isScalarType(type)) {
    const raw = typeof value === 'string' ? value : '';
    return scalarToValueNode(type, raw);
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// List and input-object value helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Variable promotion helpers
// ---------------------------------------------------------------------------

/**
 * Suggests a variable name for `argName` that does not collide with any
 * existing variable definition anywhere in `doc`. The check spans every
 * operation because the variables editor is a single document-wide JSON
 * object: two operations sharing a variable name would share its value.
 * Returns `argName` when no collision exists, otherwise appends `_2`, `_3`, etc.
 */
export function suggestVarName(doc: DocumentNode, argName: string): string {
  const existingNames = new Set<string>();
  for (const def of doc.definitions) {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      for (const vd of def.variableDefinitions ?? []) {
        existingNames.add(vd.variable.name.value);
      }
    }
  }

  if (!existingNames.has(argName)) {
    return argName;
  }
  let i = 2;
  while (existingNames.has(`${argName}_${i}`)) {
    i++;
  }
  return `${argName}_${i}`;
}

/**
 * Parses a raw string default value into a `ConstValueNode`. Handles quoted
 * strings (strips quotes), booleans, integers, and floats. Falls back to an
 * `EnumValue` for anything else (enum values and bare words).
 */
function rawToValueNode(raw: string): ConstValueNode | undefined {
  if (!raw) {
    return undefined;
  }
  // Quoted string: "foo" → StringValue
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return { kind: Kind.STRING, value: raw.slice(1, -1) };
  }
  if (raw === 'true') {
    return { kind: Kind.BOOLEAN, value: true };
  }
  if (raw === 'false') {
    return { kind: Kind.BOOLEAN, value: false };
  }
  if (/^-?\d+$/.test(raw)) {
    return { kind: Kind.INT, value: raw };
  }
  if (/^-?\d+\.\d+$/.test(raw)) {
    return { kind: Kind.FLOAT, value: raw };
  }
  // Enum value or bare string
  return { kind: Kind.ENUM, value: raw };
}

/**
 * Promotes a scalar argument on the field at `path` to a variable reference.
 * Adds `($varName: type = defaultRaw)` to the target operation's (by name, or
 * the first operation when unspecified) variable definitions and replaces the
 * inline argument value with `$varName`.
 *
 * When the operation is anonymous (shorthand query), it is converted to an
 * explicit `query` operation so that variable definitions can be added.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function promoteArgToVariable(
  doc: DocumentNode,
  path: string[],
  argName: string,
  varName: string,
  type: string,
  defaultRaw: string,
  operationName?: string,
): DocumentNode {
  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  // Build the variable definition node.
  const defaultValue = rawToValueNode(defaultRaw);
  const varDef: VariableDefinitionNode = {
    kind: Kind.VARIABLE_DEFINITION,
    variable: {
      kind: Kind.VARIABLE,
      name: { kind: Kind.NAME, value: varName },
    },
    type: {
      kind: Kind.NAMED_TYPE,
      name: { kind: Kind.NAME, value: type },
    },
    defaultValue,
    directives: [],
  };

  // Replace the inline arg value with a Variable node.
  const varValueNode: ValueNode = {
    kind: Kind.VARIABLE,
    name: { kind: Kind.NAME, value: varName },
  };

  const newSelectionSet = setArgInSelectionSet(
    operation.selectionSet,
    path,
    argName,
    varValueNode,
  );

  // The arg path didn't resolve, so nothing now references the variable; bail
  // before defining one that would dangle. (print upgrades a shorthand query
  // to `query (...) { ... }` automatically once it carries variable definitions.)
  if (newSelectionSet === operation.selectionSet) {
    return doc;
  }

  const existingVarDefs = operation.variableDefinitions ?? [];
  // Don't redefine a variable that already exists, e.g. promoting twice.
  const variableDefinitions = existingVarDefs.some(
    vd => vd.variable.name.value === varName,
  )
    ? existingVarDefs
    : [...existingVarDefs, varDef];

  const newOperation = {
    ...operation,
    variableDefinitions,
    selectionSet: newSelectionSet,
  };

  const newDefinitions = [...doc.definitions];
  newDefinitions[operationIndex] = newOperation;
  return { ...doc, definitions: newDefinitions };
}

/**
 * Demotes a variable back to an inline literal. Removes the variable
 * definition for `varName` from the target operation (by name, or the first
 * operation when unspecified) and replaces every `$varName` argument reference
 * with `inlineValue` when provided, otherwise the variable's default value
 * (or removes the arg entirely when there is neither).
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function demoteVariable(
  doc: DocumentNode,
  varName: string,
  operationName?: string,
  inlineValue?: ValueNode,
): DocumentNode {
  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  const varDefs = operation.variableDefinitions ?? [];
  const targetDef = varDefs.find(vd => vd.variable.name.value === varName);
  if (!targetDef) {
    return doc;
  }

  const value: ValueNode | undefined = inlineValue ?? targetDef.defaultValue;

  // Remove variable definition.
  const newVarDefs = varDefs.filter(vd => vd.variable.name.value !== varName);

  // Walk the selection set and replace $varName references with the value or remove.
  const newSelectionSet = replaceVariableInSelectionSet(
    operation.selectionSet,
    varName,
    value,
  );

  const newOperation = {
    ...operation,
    variableDefinitions: newVarDefs,
    selectionSet: newSelectionSet,
  };

  const newDefinitions = [...doc.definitions];
  newDefinitions[operationIndex] = newOperation;
  return { ...doc, definitions: newDefinitions };
}

function replaceVariableInSelectionSet(
  selectionSet: SelectionSetNode,
  varName: string,
  defaultValue: ValueNode | undefined,
): SelectionSetNode {
  const newSelections = selectionSet.selections.map(selection => {
    if (selection.kind === Kind.INLINE_FRAGMENT) {
      return {
        ...selection,
        selectionSet: replaceVariableInSelectionSet(
          selection.selectionSet,
          varName,
          defaultValue,
        ),
      };
    }

    if (selection.kind !== Kind.FIELD) {
      return selection;
    }

    const field = selection as FieldNode;
    const existingArgs = field.arguments ?? [];
    const newArgs = existingArgs
      .map(arg => {
        if (
          arg.value.kind === Kind.VARIABLE &&
          arg.value.name.value === varName
        ) {
          if (defaultValue === undefined) {
            return null;
          } // remove the arg
          return { ...arg, value: defaultValue };
        }
        return arg;
      })
      .filter((a): a is ArgumentNode => a !== null);

    const updatedField: FieldNode = {
      ...field,
      arguments: newArgs,
      selectionSet: field.selectionSet
        ? replaceVariableInSelectionSet(
            field.selectionSet,
            varName,
            defaultValue,
          )
        : undefined,
    };
    return updatedField;
  });

  return { ...selectionSet, selections: newSelections };
}

// ---------------------------------------------------------------------------
// Fragment helpers
// ---------------------------------------------------------------------------

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
  path: string[],
  fragmentName: string,
  typeName: string,
  operationName?: string,
): DocumentNode {
  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  // Find the target field and capture its current selection set.
  const targetSelectionSet = findSelectionSet(operation.selectionSet, path);
  if (!targetSelectionSet || targetSelectionSet.selections.length === 0) {
    return doc;
  }

  // Build the fragment definition.
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

  // Build a spread to replace the field's selections.
  const spread: FragmentSpreadNode = {
    kind: Kind.FRAGMENT_SPREAD,
    name: { kind: Kind.NAME, value: fragmentName },
    directives: [],
  };

  const spreadSet: SelectionSetNode = {
    kind: Kind.SELECTION_SET,
    selections: [spread],
  };

  // Replace the field's selection set in the operation.
  const newSelectionSet = replaceFieldSelectionSet(
    operation.selectionSet,
    path,
    spreadSet,
  );

  if (newSelectionSet === operation.selectionSet) {
    return doc;
  }

  const newOperation = { ...operation, selectionSet: newSelectionSet };
  const newDefinitions = [...doc.definitions];
  newDefinitions[operationIndex] = newOperation;

  return { ...doc, definitions: [...newDefinitions, fragmentDef] };
}

function findSelectionSet(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode | undefined {
  const node = findNodeAtPath(selectionSet, path);
  return node?.selectionSet;
}

function replaceFieldSelectionSet(
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

// ---------------------------------------------------------------------------
// Inline-fragment helpers
// ---------------------------------------------------------------------------

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

  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  // Already present — no-op.
  if (isInlineFragmentPresent(doc, path, typeName, operationName)) {
    return doc;
  }

  // Add `... on TypeName { __typename }` by treating the fragment as an
  // addressable path segment and seeding it with __typename. addField creates
  // the parent field(s) when absent, so this works even with no prior
  // selection on the abstract field.
  const fragmentPath = [...path, inlineFragmentSegment(typeName), '__typename'];
  const newSelectionSet = addField(operation.selectionSet, fragmentPath);

  const newOperation = { ...operation, selectionSet: newSelectionSet };
  const newDefinitions = [...doc.definitions];
  newDefinitions[operationIndex] = newOperation;
  return { ...doc, definitions: newDefinitions };
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

  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  // Remove the entire inline fragment by treating it as a leaf path segment.
  const fragmentPath = [...path, inlineFragmentSegment(typeName)];
  const newSelectionSet = removeField(operation.selectionSet, fragmentPath);
  if (newSelectionSet === operation.selectionSet) {
    return doc;
  }

  const newDefinitions = [...doc.definitions];
  if (newSelectionSet.selections.length === 0) {
    // Removing the fragment emptied the operation; drop it (an operation with
    // no selection set is unprintable).
    newDefinitions.splice(operationIndex, 1);
  } else {
    // Dropping the fragment can orphan a variable a field inside it used.
    newDefinitions[operationIndex] = pruneUnusedVariableDefinitions(
      { ...operation, selectionSet: newSelectionSet },
      doc,
    );
  }
  return { ...doc, definitions: newDefinitions };
}

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
 * Sets or removes a named argument on the field located at `path` within the
 * target operation (by name, or the first operation when unspecified) of `doc`.
 * When `value` is `undefined` the argument is removed; otherwise it is added
 * or updated in place.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function setFieldArgument(
  doc: DocumentNode,
  path: string[],
  argName: string,
  value: ValueNode | undefined,
  operationName?: string,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  const operationIndex = findOperationIndex(doc, operationName);
  if (operationIndex === -1) {
    return doc;
  }

  const operation = doc.definitions[operationIndex]!;
  if (operation.kind !== Kind.OPERATION_DEFINITION) {
    return doc;
  }

  const newSelectionSet = setArgInSelectionSet(
    operation.selectionSet,
    path,
    argName,
    value,
  );
  if (newSelectionSet === operation.selectionSet) {
    return doc;
  }

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addField(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode {
  const [segment, ...rest] = path as [string, ...string[]];

  if (rest.length === 0) {
    // Leaf — add the node if not already present.
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

  // Non-leaf — descend into the child node (creating it if necessary).
  const existingIndex = selectionSet.selections.findIndex(s =>
    selectionMatchesSegment(s, segment),
  );

  if (existingIndex === -1) {
    // Parent doesn't exist yet — create it with an empty selection set, then
    // recurse to add the child.
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

function removeField(
  selectionSet: SelectionSetNode,
  path: string[],
): SelectionSetNode {
  // Delete the terminal node (fn returns null); pruneEmptyParent=true
  // ensures any ancestor whose child set became empty is also pruned.
  return mapNodeAtPath(selectionSet, path, () => null, true);
}
