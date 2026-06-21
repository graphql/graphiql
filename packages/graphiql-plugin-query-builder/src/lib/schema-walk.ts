import {
  Kind,
  isInterfaceType,
  isObjectType,
  visit,
  type DocumentNode,
  type FieldNode,
  type GraphQLArgument,
  type GraphQLNamedType,
  type GraphQLSchema,
  type InlineFragmentNode,
  type SelectionNode,
  getNamedType,
} from 'graphql';
import {
  fieldSegment,
  inlineFragmentSegment,
  type PathSegment,
} from './ast-path';

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
 * selection sets. Inline fragments contribute an `inlineFragment` path segment
 * (matching the builder's path model), so the cursor resolves to fields nested
 * inside union/interface type conditions too. Returns `[]` when the cursor
 * isn't inside a field or fragment.
 */
export function fieldPathAtOffset(
  doc: DocumentNode,
  offset: number,
): PathSegment[] {
  const op = doc.definitions.find(
    d =>
      d.kind === Kind.OPERATION_DEFINITION &&
      d.loc != null &&
      d.loc.start <= offset &&
      d.loc.end >= offset,
  );
  if (!op || op.kind !== Kind.OPERATION_DEFINITION) {
    return [];
  }
  const path: PathSegment[] = [];
  let selections: readonly SelectionNode[] = op.selectionSet.selections;
  while (true) {
    const selection = selections.find(
      (s): s is FieldNode | InlineFragmentNode =>
        (s.kind === Kind.FIELD || s.kind === Kind.INLINE_FRAGMENT) &&
        s.loc != null &&
        s.loc.start <= offset &&
        s.loc.end >= offset,
    );
    if (!selection) {
      break;
    }
    if (selection.kind === Kind.FIELD) {
      path.push(fieldSegment(selection.name.value));
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
          d.kind === Kind.OPERATION_DEFINITION &&
          d.name?.value === operationName,
      )
    : undefined;
  const op =
    byName ?? doc.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION);
  return op?.kind === Kind.OPERATION_DEFINITION ? op : undefined;
}

/**
 * Matches a path segment against a selection, by schema field name or, for an
 * inline-fragment segment, by type condition. Mirrors the document-mutator path
 * model so the cursor/path helpers agree with it.
 */
function selectionMatchesSegment(
  selection: SelectionNode,
  segment: PathSegment,
): boolean {
  switch (segment.kind) {
    case 'inlineFragment':
      return (
        selection.kind === Kind.INLINE_FRAGMENT &&
        selection.typeCondition?.name.value === segment.typeName
      );
    case 'field':
      return (
        selection.kind === Kind.FIELD && selection.name.value === segment.name
      );
  }
}

/**
 * Extracts the raw, printable value string for an argument at `path` from the
 * document, e.g. `"abc"` for a string or `42` for an int. Returns an empty
 * string when the field, arg, or a value we can render is not found. Walks both
 * field and inline-fragment path segments.
 */
export function extractRawArgValue(
  doc: DocumentNode,
  path: PathSegment[],
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
      if (node.kind !== Kind.FIELD) {
        return '';
      }
      const argNode = (node.arguments ?? []).find(
        a => a.name.value === argName,
      );
      if (!argNode) {
        return '';
      }
      const v = argNode.value;
      if (v.kind === Kind.STRING) {
        return `"${v.value}"`;
      }
      if (v.kind === Kind.INT || v.kind === Kind.FLOAT) {
        return v.value;
      }
      if (v.kind === Kind.BOOLEAN) {
        return String(v.value);
      }
      if (v.kind === Kind.ENUM) {
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
  const op = findOperationDefinition(doc, operationName);
  if (op) {
    visit(op, {
      Field() {
        count++;
      },
    });
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
  path: PathSegment[],
  argName: string,
): GraphQLArgument | undefined {
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
  let targetField: { args: readonly GraphQLArgument[] } | undefined;
  for (const seg of path) {
    if (seg.kind === 'inlineFragment') {
      const condition = schema.getType(seg.typeName);
      if (!condition) {
        return;
      }
      currentType = condition;
      targetField = undefined;
      continue;
    }
    if (!(isObjectType(currentType) || isInterfaceType(currentType))) {
      return;
    }
    const fields = currentType.getFields();
    const f = fields[seg.name] as
      | { type: unknown; args: readonly GraphQLArgument[] }
      | undefined;
    if (!f) {
      return;
    }
    targetField = f;
    const named = getNamedType(f.type as Parameters<typeof getNamedType>[0]);
    if (named && (isObjectType(named) || isInterfaceType(named))) {
      currentType = named;
    }
  }
  return targetField?.args.find(a => a.name === argName);
}

/**
 * Resolves the named type reached by walking `path` from the root type for
 * `activeOpKind`. Field segments descend into the field's type; `inlineFragment`
 * segments switch to that type condition. Returns undefined when a segment
 * doesn't resolve. Used to pick the type condition when extracting a field's
 * selection into a fragment.
 */
export function resolveFieldNamedType(
  schema: GraphQLSchema,
  activeOpKind: string | undefined,
  path: PathSegment[],
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
    if (seg.kind === 'inlineFragment') {
      const condition = schema.getType(seg.typeName);
      if (!condition) {
        return;
      }
      currentType = condition;
      result = condition;
      continue;
    }
    if (!(isObjectType(currentType) || isInterfaceType(currentType))) {
      return;
    }
    const fields = currentType.getFields();
    const f = fields[seg.name] as { type: unknown } | undefined;
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
