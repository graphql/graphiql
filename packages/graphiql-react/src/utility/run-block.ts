import type { HttpMethod } from '@graphiql/toolkit';
import { OperationDefinitionNode, OperationTypeNode } from 'graphql';

/**
 * Shown when the user tries to run a mutation while a safe method (GET or
 * QUERY) is selected. Mutations are forbidden over safe methods: GET by the
 * GraphQL-over-HTTP spec, and QUERY by the HTTP QUERY method's safety semantics.
 */
export const MUTATION_REQUIRES_POST_REASON =
  'Mutations can only be sent via POST';

/**
 * The operation that a run would execute: the sole operation when there is one,
 * otherwise the one whose name matches `operationName`. Returns `undefined` when
 * the choice is ambiguous (several operations, no matching name).
 */
export function resolveActiveOperation(
  operations: readonly OperationDefinitionNode[] | undefined,
  operationName: string | null | undefined,
): OperationDefinitionNode | undefined {
  if (!operations?.length) {
    return undefined;
  }
  if (operations.length === 1) {
    return operations[0];
  }
  return operations.find(op => op.name?.value === operationName);
}

/**
 * Returns a human-readable reason a run is blocked, or `null` when it may
 * proceed. Currently the only reason is a mutation over a safe method (GET or
 * QUERY), both of which forbid mutations.
 */
export function getRunBlockReason(
  method: HttpMethod | null | undefined,
  operation?: OperationDefinitionNode,
): string | null {
  const effectiveMethod = method ?? 'POST';
  if (
    effectiveMethod !== 'POST' &&
    operation?.operation === OperationTypeNode.MUTATION
  ) {
    return MUTATION_REQUIRES_POST_REASON;
  }
  return null;
}
