// eslint-disable-next-line react/jsx-filename-extension -- TODO
import {
  Fetcher,
  formatError,
  formatResult,
  GetDefaultFieldNamesFn,
  isAsyncIterable,
  isObservable,
  Unsubscribable,
} from '@graphiql/toolkit';
import {
  ExecutionResult,
  FragmentDefinitionNode,
  GraphQLError,
  print,
} from 'graphql';
import { getFragmentDependenciesForAST } from 'graphql-language-service';
import { FC, ReactElement, ReactNode, useEffect } from 'react';
import setValue from 'set-value';
import getValue from 'get-value';

import { getAutoCompleteLeafs } from '../editor';
import { createStore } from 'zustand';
import { editorStore } from './editor';
import { createBoundedUseStore } from '../utility';

type ExecutionStoreType = {
  /**
   * If there is currently a GraphQL request in-flight. For multipart
   * requests like subscriptions, this will be `true` while fetching the
   * first partial response and `false` while fetching subsequent batches.
   * @default false
   */
  isFetching: boolean;
  /**
   * Represents an active GraphQL subscription.
   *
   * For multipart operations such as subscriptions, this
   * will hold an `Unsubscribable` object while the request is in-flight. It
   * remains non-null until the operation completes or is manually unsubscribed.
   *
   * @remarks Use `subscription?.unsubscribe()` to cancel the request.
   * @default null
   */
  subscription: Unsubscribable | null;
  /**
   * The operation name that will be sent with all GraphQL requests.
   * @default null
   */
  operationName: string | null;
  /**
   * Start a GraphQL request based on the current editor contents.
   */
  run(): void;
  /**
   * Stop the GraphQL request that is currently in-flight.
   */
  stop(): void;
  /**
   * A function to determine which field leafs are automatically added when
   * trying to execute a query with missing selection sets. It will be called
   * with the `GraphQLType` for which fields need to be added.
   */
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
  /**
   * @default 0
   */
  queryId: number;

  /**
   * A function which accepts GraphQL HTTP parameters and returns a `Promise`,
   * `Observable` or `AsyncIterable` that returns the GraphQL response in
   * parsed JSON format.
   *
   * We suggest using the `createGraphiQLFetcher` utility from `@graphiql/toolkit`
   * to create these fetcher functions.
   *
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#creategraphiqlfetcher-2|`createGraphiQLFetcher`}
   */
  fetcher: Fetcher;
};

type ExecutionStoreProps = Pick<
  ExecutionStoreType,
  'getDefaultFieldNames' | 'fetcher'
> & {
  children: ReactNode;
  /**
   * This prop sets the operation name that is passed with a GraphQL request.
   */
  operationName?: string;
};

export const executionStore = createStore<
  ExecutionStoreType & Pick<ExecutionStoreProps, 'getDefaultFieldNames'>
>((set, get) => ({
  isFetching: false,
  subscription: null,
  operationName: null,
  getDefaultFieldNames: undefined,
  queryId: 0,
  fetcher: null!,
  stop() {
    const { subscription } = get();
    subscription?.unsubscribe();
    set({ isFetching: false, subscription: null });
  },
  async run() {
    const {
      externalFragments,
      headerEditor,
      queryEditor,
      responseEditor,
      variableEditor,
      updateActiveTabValues,
    } = editorStore.getState();
    if (!queryEditor || !responseEditor) {
      return;
    }
    const { subscription, operationName, queryId, fetcher } = get();

    // If there's an active subscription, unsubscribe it and return
    if (subscription) {
      stop();
      return;
    }

    const setResponse = (value: string) => {
      responseEditor.setValue(value);
      updateActiveTabValues({ response: value });
    };

    const newQueryId = queryId + 1;
    set({ queryId: newQueryId });

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    let query = getAutoCompleteLeafs() || queryEditor.getValue();

    const variablesString = variableEditor?.getValue();
    let variables: Record<string, unknown> | undefined;
    try {
      variables = tryParseJsonObject({
        json: variablesString,
        errorMessageParse: 'Variables are invalid JSON',
        errorMessageType: 'Variables are not a JSON object.',
      });
    } catch (error) {
      setResponse(error instanceof Error ? error.message : `${error}`);
      return;
    }

    const headersString = headerEditor?.getValue();
    let headers: Record<string, unknown> | undefined;
    try {
      headers = tryParseJsonObject({
        json: headersString,
        errorMessageParse: 'Headers are invalid JSON',
        errorMessageType: 'Headers are not a JSON object.',
      });
    } catch (error) {
      setResponse(error instanceof Error ? error.message : `${error}`);
      return;
    }

    if (externalFragments) {
      const fragmentDependencies = queryEditor.documentAST
        ? getFragmentDependenciesForAST(
            queryEditor.documentAST,
            externalFragments,
          )
        : [];
      if (fragmentDependencies.length > 0) {
        query +=
          '\n' +
          fragmentDependencies
            .map((node: FragmentDefinitionNode) => print(node))
            .join('\n');
      }
    }

    setResponse('');
    set({ isFetching: true });
    try {
      const fullResponse: ExecutionResult = {};
      const handleResponse = (result: ExecutionResult) => {
        // A different query was dispatched in the meantime, so don't
        // show the results of this one.
        if (newQueryId !== get().queryId) {
          return;
        }

        let maybeMultipart = Array.isArray(result) ? result : false;
        if (
          !maybeMultipart &&
          typeof result === 'object' &&
          result !== null &&
          'hasNext' in result
        ) {
          maybeMultipart = [result];
        }

        if (maybeMultipart) {
          for (const part of maybeMultipart) {
            mergeIncrementalResult(fullResponse, part);
          }

          set({ isFetching: false });
          setResponse(formatResult(fullResponse));
        } else {
          set({ isFetching: false });
          setResponse(formatResult(result));
        }
      };
      const fetch = fetcher(
        {
          query,
          variables,
          operationName:
            operationName ?? queryEditor.operationName ?? undefined,
        },
        {
          headers: headers ?? undefined,
          documentAST: queryEditor.documentAST ?? undefined,
        },
      );

      const value = await fetch;
      if (isObservable(value)) {
        // If the fetcher returned an Observable, then subscribe to it, calling
        // the callback on each next value and handling both errors and the
        // completion of the Observable.
        const newSubscription = value.subscribe({
          next(result) {
            handleResponse(result);
          },
          error(error: Error) {
            set({ isFetching: false });
            if (error) {
              setResponse(formatError(error));
            }
            set({ subscription: null });
          },
          complete() {
            set({ isFetching: false, subscription: null });
          },
        });
        set({ subscription: newSubscription });
      } else if (isAsyncIterable(value)) {
        const newSubscription = {
          unsubscribe: () => value[Symbol.asyncIterator]().return?.(),
        };
        set({ subscription: newSubscription });
        for await (const result of value) {
          handleResponse(result);
        }
        set({ isFetching: false, subscription: null });
      } else {
        handleResponse(value);
      }
    } catch (error) {
      set({ isFetching: false });
      setResponse(formatError(error));
      set({ subscription: null });
    }
  },
}));

export const ExecutionStore: FC<ExecutionStoreProps> = ({
  fetcher,
  getDefaultFieldNames,
  children,
  operationName = null,
}) => {
  useEffect(() => {
    executionStore.setState({
      operationName,
      getDefaultFieldNames,
      fetcher,
    });
  }, [getDefaultFieldNames, operationName, fetcher]);

  return children as ReactElement;
};

export const useExecutionStore = createBoundedUseStore(executionStore);

function tryParseJsonObject({
  json,
  errorMessageParse,
  errorMessageType,
}: {
  json?: string;
  errorMessageParse: string;
  errorMessageType: string;
}) {
  let parsed: Record<string, any> | undefined;
  try {
    parsed = json && json.trim() !== '' ? JSON.parse(json) : undefined;
  } catch (error) {
    throw new Error(
      `${errorMessageParse}: ${
        error instanceof Error ? error.message : error
      }.`,
    );
  }
  const isObject =
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  if (parsed !== undefined && !isObject) {
    throw new Error(errorMessageType);
  }
  return parsed;
}

type IncrementalResult = {
  data?: Record<string, unknown> | null;
  errors?: ReadonlyArray<GraphQLError>;
  extensions?: Record<string, unknown>;
  hasNext?: boolean;
  path?: ReadonlyArray<string | number>;
  incremental?: ReadonlyArray<IncrementalResult>;
  label?: string;
  items?: ReadonlyArray<Record<string, unknown>> | null;
  pending?: ReadonlyArray<{ id: string; path: ReadonlyArray<string | number> }>;
  completed?: ReadonlyArray<{
    id: string;
    errors?: ReadonlyArray<GraphQLError>;
  }>;
  id?: string;
  subPath?: ReadonlyArray<string | number>;
};

const pathsMap = new WeakMap<
  ExecutionResult,
  Map<string, ReadonlyArray<string | number>>
>();

/**
 * @param executionResult The complete execution result object which will be
 * mutated by merging the contents of the incremental result.
 * @param incrementalResult The incremental result that will be merged into the
 * complete execution result.
 */
function mergeIncrementalResult(
  executionResult: IncrementalResult,
  incrementalResult: IncrementalResult,
): void {
  let path: ReadonlyArray<string | number> | undefined = [
    'data',
    ...(incrementalResult.path ?? []),
  ];

  for (const result of [executionResult, incrementalResult]) {
    if (result.pending) {
      let paths = pathsMap.get(executionResult);
      if (paths === undefined) {
        paths = new Map();
        pathsMap.set(executionResult, paths);
      }

      for (const { id, path: pendingPath } of result.pending) {
        paths.set(id, ['data', ...pendingPath]);
      }
    }
  }

  const { items } = incrementalResult;
  if (items) {
    const { id } = incrementalResult;
    if (id) {
      path = pathsMap.get(executionResult)?.get(id);
      if (path === undefined) {
        throw new Error('Invalid incremental delivery format.');
      }

      const list = getValue(executionResult, path.join('.'));
      list.push(...items);
    } else {
      path = ['data', ...(incrementalResult.path ?? [])];
      for (const item of items) {
        setValue(executionResult, path.join('.'), item);
        // Increment the last path segment (the array index) to merge the next item at the next index
        // @ts-expect-error -- (path[path.length - 1] as number)++ breaks react compiler
        path[path.length - 1]++;
      }
    }
  }

  const { data } = incrementalResult;
  if (data) {
    const { id } = incrementalResult;
    if (id) {
      path = pathsMap.get(executionResult)?.get(id);
      if (path === undefined) {
        throw new Error('Invalid incremental delivery format.');
      }
      const { subPath } = incrementalResult;
      if (subPath !== undefined) {
        path = [...path, ...subPath];
      }
    }
    setValue(executionResult, path.join('.'), data, {
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

  if (incrementalResult.completed) {
    // Remove tracking and add additional errors
    for (const { id, errors } of incrementalResult.completed) {
      pathsMap.get(executionResult)?.delete(id);

      if (errors) {
        executionResult.errors ||= [];
        (executionResult.errors as GraphQLError[]).push(...errors);
      }
    }
  }
}
