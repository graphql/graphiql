import {
  getNamedType,
  isEnumType,
  isInputObjectType,
  isScalarType,
} from 'graphql';
import type { GraphQLType } from 'graphql';

export type GraphQLTypeCategory = 'scalar' | 'enum' | 'input' | 'composite';

/**
 * Buckets a GraphQL type into one of four color categories, unwrapping list
 * and non-null wrappers first. `composite` covers object, interface, and
 * union types — they share a color because they share an interaction (you
 * select fields on all three). The bucketing is a styling convention, not a
 * GraphQL invariant.
 */
export function typeCategory(type: GraphQLType): GraphQLTypeCategory {
  const named = getNamedType(type);
  if (isScalarType(named)) {
    return 'scalar';
  }
  if (isEnumType(named)) {
    return 'enum';
  }
  if (isInputObjectType(named)) {
    return 'input';
  }
  return 'composite';
}
