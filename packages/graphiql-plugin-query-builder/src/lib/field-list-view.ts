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
