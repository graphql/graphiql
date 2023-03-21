import { OperationDefinitionNode } from 'graphql';

/**
 * Provided optional previous operations and selected name, and a next list of
 * operations, determine what the next selected operation should be.
 */
export function getSelectedOperationName(
  prevOperations?: OperationDefinitionNode[] | undefined,
  prevSelectedOperationName?: string,
  operations?: OperationDefinitionNode[],
) {
  // If there are not enough operations to bother with, return nothing.
  if (!operations || operations.length < 1) {
    return;
  }

  // If a previous selection still exists, continue to use it.
  const names = operations.map(op => op.name?.value);
  if (prevSelectedOperationName && names.includes(prevSelectedOperationName)) {
    return prevSelectedOperationName;
  }

  // If a previous selection was the Nth operation, use the same Nth.
  if (prevSelectedOperationName && prevOperations) {
    const prevNames = prevOperations.map(op => op.name?.value);
    const prevIndex = prevNames.indexOf(prevSelectedOperationName);
    if (prevIndex !== -1 && prevIndex < names.length) {
      return names[prevIndex];
    }
  }

  // Use the first operation.
  return names[0];
}
