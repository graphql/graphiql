import { ExecutionResult, GraphQLError } from 'graphql';
import setValue from 'set-value';

/**
 * @param executionResult The complete execution result object which will be
 * mutated by merging the contents of the incremental result.
 * @param incrementalResult The incremental result that will be merged into the
 * complete execution result.
 */
export function mergeIncrementalResult(
  executionResult: ExecutionResult,
  incrementalResult: IncrementalResult,
): void {
  const path = ['data', ...(incrementalResult.path ?? [])];

  if (incrementalResult.items) {
    for (const item of incrementalResult.items) {
      setValue(executionResult, path.join('.'), item);
      // Increment the last path segment (the array index) to merge the next item at the next index
      // eslint-disable-next-line unicorn/prefer-at -- cannot mutate the array using Array.at()
      (path[path.length - 1] as number)++;
    }
  }

  if (incrementalResult.data) {
    setValue(executionResult, path.join('.'), incrementalResult.data, {
      merge: true,
    });
  }

  if (incrementalResult.errors) {
    executionResult.errors ||= [];
    (executionResult.errors as GraphQLError[]).push(
      ...incrementalResult.errors,
    );
  }

  if (incrementalResult.extensions) {
    setValue(executionResult, 'extensions', incrementalResult.extensions, {
      merge: true,
    });
  }

  if (incrementalResult.incremental) {
    for (const incrementalSubResult of incrementalResult.incremental) {
      mergeIncrementalResult(executionResult, incrementalSubResult);
    }
  }
}

export type IncrementalResult = {
  data?: Record<string, unknown> | null;
  errors?: ReadonlyArray<GraphQLError>;
  extensions?: Record<string, unknown>;
  hasNext?: boolean;
  path?: ReadonlyArray<string | number>;
  incremental?: ReadonlyArray<IncrementalResult>;
  label?: string;
  items?: ReadonlyArray<Record<string, unknown>> | null;
};
