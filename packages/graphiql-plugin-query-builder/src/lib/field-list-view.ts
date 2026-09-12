import { getNamedType, type GraphQLField } from 'graphql';

/** Field lists longer than this are capped by default and gain a filter input. */
export const FIELD_LIST_THRESHOLD = 20;

/**
 * Case-insensitive substring match over a field's name, description, and named
 * type. An empty/whitespace query matches everything (treated as "no filter").
 */
export function fieldMatchesFilter(
  field: GraphQLField<unknown, unknown>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return true;
  }
  if (field.name.toLowerCase().includes(q)) {
    return true;
  }
  if (field.description?.toLowerCase().includes(q)) {
    return true;
  }
  return getNamedType(field.type).name.toLowerCase().includes(q);
}

interface SelectVisibleFieldsInput {
  fields: GraphQLField<unknown, unknown>[];
  /** True when the field (by name) is already selected in the query at this path. */
  isSelected: (fieldName: string) => boolean;
  threshold: number;
  /** True when the user clicked "N more" to reveal the full list. */
  expanded: boolean;
  /** Active filter text; empty string means no filter. */
  filter: string;
}

interface VisibleFields {
  visible: GraphQLField<unknown, unknown>[];
  /** Count of fields hidden only by the cap (0 while filtering or expanded). */
  hiddenCount: number;
}

/**
 * Decide which fields of a list to render. A filter (when non-empty) bypasses the
 * cap and shows all matches. Otherwise the first `threshold` fields show in schema
 * order, plus any selected field beyond the cap (selected fields never hide).
 */
export function selectVisibleFields({
  fields,
  isSelected,
  threshold,
  expanded,
  filter,
}: SelectVisibleFieldsInput): VisibleFields {
  if (filter.trim() !== '') {
    return {
      visible: fields.filter(f => fieldMatchesFilter(f, filter)),
      hiddenCount: 0,
    };
  }

  if (expanded || fields.length <= threshold) {
    return { visible: fields, hiddenCount: 0 };
  }

  const visible = fields.filter(
    (field, index) => index < threshold || isSelected(field.name),
  );
  return { visible, hiddenCount: fields.length - visible.length };
}
