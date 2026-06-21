import {
  Kind,
  type DocumentNode,
  type FieldNode,
  type ValueNode,
} from 'graphql';

import {
  findNodeAtPath,
  findOperation,
  mapOperation,
  setArgInSelectionSet,
  type PathSegment,
} from './ast-path';
import { type ArgValue, valueNodeToArgValue } from './arg-value';

/**
 * Returns a map of argument name → variable name for arguments at `path` that
 * are currently bound to a variable (i.e., the argument value is a
 * `Variable` node). Only includes args that are variable-bound; literal-valued
 * args are omitted.
 */
export function getFieldArgVariables(
  doc: DocumentNode,
  path: PathSegment[],
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
  path: PathSegment[],
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
 * Sets or removes a named argument on the field located at `path` within the
 * target operation (by name, or the first operation when unspecified) of `doc`.
 * When `value` is `undefined` the argument is removed; otherwise it is added
 * or updated in place.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function setFieldArgument(
  doc: DocumentNode,
  path: PathSegment[],
  argName: string,
  value: ValueNode | undefined,
  operationName?: string,
): DocumentNode {
  if (path.length === 0) {
    return doc;
  }

  return mapOperation(doc, operationName, operation => {
    const newSelectionSet = setArgInSelectionSet(
      operation.selectionSet,
      path,
      argName,
      value,
    );
    if (newSelectionSet === operation.selectionSet) {
      return operation;
    }
    return { ...operation, selectionSet: newSelectionSet };
  });
}
