import type { HttpMethod } from '@graphiql/toolkit';
import { OperationDefinitionNode, OperationTypeNode } from 'graphql';

/**
 * Shown when the user tries to run a mutation while the GET method is selected.
 * Mutations are forbidden over GET by the GraphQL-over-HTTP spec.
 */
export const MUTATION_OVER_GET_REASON =
  "Mutations can't be sent over GET — switch to POST.";

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
 * proceed. Currently the only reason is a mutation over GET.
 */
export function getRunBlockReason(
  method: HttpMethod | null | undefined,
  operation?: OperationDefinitionNode,
): string | null {
  const effectiveMethod = method ?? 'POST';
  if (
    effectiveMethod === 'GET' &&
    operation?.operation === OperationTypeNode.MUTATION
  ) {
    return MUTATION_OVER_GET_REASON;
  }
  return null;
}
