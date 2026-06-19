import {
  type DocumentNode,
  type FieldNode,
  type GraphQLArgument,
  type GraphQLNamedType,
  type GraphQLSchema,
  type InlineFragmentNode,
  type SelectionNode,
  getNamedType,
} from 'graphql';
import { inlineFragmentSegment } from './document-mutator';

/**
 * Safely parse the variables JSON text, returning a plain object or {} on
 * failure. Arrays and non-object values are treated as empty.
 */
export function readVariables(
  text: string | null | undefined,
): Record<string, unknown> {
  if (!text || !text.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Returns the tree path of the selection whose source range contains `offset`,
 * walking from the operation that contains the cursor down through nested
 * selection sets. Inline fragments contribute a `... on TypeName` segment
 * (matching the builder's path model), so the cursor resolves to fields nested
 * inside union/interface type conditions too. Returns `[]` when the cursor
 * isn't inside a field or fragment.
 */
export function fieldPathAtOffset(doc: DocumentNode, offset: number): string[] {
  const op = doc.definitions.find(
    d =>
      d.kind === 'OperationDefinition' &&
      d.loc != null &&
      d.loc.start <= offset &&
      d.loc.end >= offset,
  );
  if (!op || op.kind !== 'OperationDefinition') {
    return [];
  }
  const path: string[] = [];
  let selections: readonly SelectionNode[] = op.selectionSet.selections;
  for (;;) {
    const selection = selections.find(
      (s): s is FieldNode | InlineFragmentNode =>
        (s.kind === 'Field' || s.kind === 'InlineFragment') &&
        s.loc != null &&
        s.loc.start <= offset &&
        s.loc.end >= offset,
    );
    if (!selection) {
      break;
    }
    if (selection.kind === 'Field') {
      path.push(selection.name.value);
    } else {
      const typeName = selection.typeCondition?.name.value;
      if (!typeName) {
        break;
      }
      path.push(inlineFragmentSegment(typeName));
    }
    if (!selection.selectionSet) {
      break;
    }
    selections = selection.selectionSet.selections;
  }
  return path;
}

/**
 * Resolves the operation to read from: the one named `operationName` when given
 * and present, otherwise the first operation definition.
 */
function findOperationDefinition(doc: DocumentNode, operationName?: string) {
  const byName = operationName
    ? doc.definitions.find(
        d =>
          d.kind === 'OperationDefinition' && d.name?.value === operationName,
      )
    : undefined;
  const op =
    byName ?? doc.definitions.find(d => d.kind === 'OperationDefinition');
  return op?.kind === 'OperationDefinition' ? op : undefined;
}

/**
 * Matches a path segment against a selection, by schema field name or, for a
 * `... on TypeName` segment, by inline-fragment type condition. Mirrors the
 * document-mutator path model so the cursor/path helpers agree with it.
 */
function selectionMatchesSegment(
  selection: SelectionNode,
  segment: string,
): boolean {
  if (segment.startsWith('... on ')) {
    const typeName = segment.slice('... on '.length);
    return (
      selection.kind === 'InlineFragment' &&
      selection.typeCondition?.name.value === typeName
    );
  }
  return selection.kind === 'Field' && selection.name.value === segment;
}

/**
 * Extracts the raw, printable value string for an argument at `path` from the
 * document, e.g. `"abc"` for a string or `42` for an int. Returns an empty
 * string when the field, arg, or a value we can render is not found. Walks both
 * field and inline-fragment path segments.
 */
export function extractRawArgValue(
  doc: DocumentNode,
  path: string[],
  argName: string,
  operationName?: string,
): string {
  const op = findOperationDefinition(doc, operationName);
  if (!op) {
    return '';
  }

  let selections: readonly SelectionNode[] = op.selectionSet.selections;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i]!;
    const node = selections.find((s): s is FieldNode | InlineFragmentNode =>
      selectionMatchesSegment(s, seg),
    );
    if (!node) {
      return '';
    }
    if (i === path.length - 1) {
      if (node.kind !== 'Field') {
        return '';
      }
      const argNode = (node.arguments ?? []).find(
        a => a.name.value === argName,
      );
      if (!argNode) {
        return '';
      }
      const v = argNode.value;
      if (v.kind === 'StringValue') {
        return `"${v.value}"`;
      }
      if (v.kind === 'IntValue' || v.kind === 'FloatValue') {
        return v.value;
      }
      if (v.kind === 'BooleanValue') {
        return String(v.value);
      }
      if (v.kind === 'EnumValue') {
        return v.value;
      }
      return '';
    }
    if (!node.selectionSet) {
      return '';
    }
    selections = node.selectionSet.selections;
  }
  return '';
}

/** Counts the fields selected in the target operation (nested fields included). */
export function countSelectedFields(
  doc: DocumentNode,
  operationName?: string,
): number {
  let count = 0;
  function walk(selections: readonly SelectionNode[]) {
    for (const sel of selections) {
      if (sel.kind === 'Field') {
        count++;
        if (sel.selectionSet) {
          walk(sel.selectionSet.selections);
        }
      } else if (sel.kind === 'InlineFragment' && sel.selectionSet) {
        walk(sel.selectionSet.selections);
      }
    }
  }

  const op = findOperationDefinition(doc, operationName);
  if (op) {
    walk(op.selectionSet.selections);
  }
  return count;
}

/**
 * Resolves the schema `GraphQLArgument` for the argument `argName` on the field
 * addressed by `path`, walking from the root type for `activeOpKind`. Returns
 * undefined when the field or arg can't be resolved against the schema.
 */
export function resolveSchemaArg(
  schema: GraphQLSchema,
  activeOpKind: string | undefined,
  path: string[],
  argName: string,
): GraphQLArgument | undefined {
  const [rootName, ...rest] = path;
  const rootType =
    (activeOpKind === 'mutation'
      ? schema.getMutationType()
      : activeOpKind === 'subscription'
        ? schema.getSubscriptionType()
        : schema.getQueryType()) ?? schema.getQueryType();
  if (!rootType || !rootName) {
    return;
  }

  let currentType: GraphQLNamedType = rootType;
  let targetField: { args: readonly GraphQLArgument[] } | undefined;
  const fieldNames = rest.length === 0 ? [rootName] : [rootName, ...rest];
  for (const name of fieldNames) {
    if (name.startsWith('... on ')) {
      const condition = schema.getType(name.slice('... on '.length));
      if (!condition) {
        return;
      }
      currentType = condition;
      targetField = undefined;
      continue;
    }
    if (!('getFields' in currentType)) {
      return;
    }
    const fields = (
      currentType as { getFields: () => Record<string, unknown> }
    ).getFields();
    const f = fields[name] as
      | { type: unknown; args: readonly GraphQLArgument[] }
      | undefined;
    if (!f) {
      return;
    }
    targetField = f;
    const named = getNamedType(f.type as Parameters<typeof getNamedType>[0]);
    if (named && 'getFields' in named) {
      currentType = named;
    }
  }
  return targetField?.args.find(a => a.name === argName);
}

/**
 * Resolves the named type reached by walking `path` from the root type for
 * `activeOpKind`. Field segments descend into the field's type; `... on Type`
 * segments switch to that type condition. Returns undefined when a segment
 * doesn't resolve. Used to pick the type condition when extracting a field's
 * selection into a fragment.
 */
export function resolveFieldNamedType(
  schema: GraphQLSchema,
  activeOpKind: string | undefined,
  path: string[],
): GraphQLNamedType | undefined {
  const rootType =
    (activeOpKind === 'mutation'
      ? schema.getMutationType()
      : activeOpKind === 'subscription'
        ? schema.getSubscriptionType()
        : schema.getQueryType()) ?? schema.getQueryType();
  if (!rootType || path.length === 0) {
    return;
  }

  let currentType: GraphQLNamedType = rootType;
  let result: GraphQLNamedType | undefined;
  for (const seg of path) {
    if (seg.startsWith('... on ')) {
      const condition = schema.getType(seg.slice('... on '.length));
      if (!condition) {
        return;
      }
      currentType = condition;
      result = condition;
      continue;
    }
    if (!('getFields' in currentType)) {
      return;
    }
    const fields = (
      currentType as { getFields: () => Record<string, unknown> }
    ).getFields();
    const f = fields[seg] as { type: unknown } | undefined;
    if (!f) {
      return;
    }
    const named = getNamedType(f.type as Parameters<typeof getNamedType>[0]);
    if (!named) {
      return;
    }
    result = named;
    currentType = named;
  }
  return result;
}
