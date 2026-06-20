import {
  GraphQLEnumType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
  Kind,
  type ConstValueNode,
  type GraphQLInputType,
  type GraphQLScalarType,
  type ListValueNode,
  type ObjectFieldNode,
  type ObjectValueNode,
  type ValueNode,
} from 'graphql';

/**
 * A recursive value type for GraphQL input arguments. Leaves are always
 * strings (the raw unquoted text the user typed); lists and input objects
 * are represented as arrays and plain objects respectively.
 */
export type ArgValue = string | ArgValue[] | { [field: string]: ArgValue };

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
    case 'Int': {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        return undefined;
      }
      const int = Math.trunc(n);
      if (!Number.isSafeInteger(int)) {
        return undefined;
      }
      return { kind: Kind.INT, value: String(int) };
    }
    case 'Float': {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        return undefined;
      }
      return { kind: Kind.FLOAT, value: String(n) };
    }
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
 * Parses a raw string default value into a `ConstValueNode`. Handles quoted
 * strings (strips quotes), booleans, integers, and floats. Falls back to an
 * `EnumValue` for anything else (enum values and bare words).
 */
export function rawToValueNode(raw: string): ConstValueNode | undefined {
  if (!raw) {
    return undefined;
  }
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
  return { kind: Kind.ENUM, value: raw };
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

  if (isEnumType(type) || isScalarType(type)) {
    const raw = typeof value === 'string' ? value : '';
    return scalarToValueNode(type, raw);
  }

  return undefined;
}
