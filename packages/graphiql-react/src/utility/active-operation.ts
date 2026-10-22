import type { OperationDefinitionNode } from 'graphql';

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
