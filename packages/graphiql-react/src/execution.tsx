import {
  Fetcher,
  formatError,
  formatResult,
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
import { ReactNode, useRef, useState } from 'react';
import setValue from 'set-value';
import getValue from 'get-value';

import { useAutoCompleteLeafs, useEditorContext } from './editor';
import { UseAutoCompleteLeafsArgs } from './editor/hooks';
import { useHistoryContext } from './history';
import { createContextHook, createNullableContext } from './utility/context';

export type ExecutionContextType = {
  /**
   * If there is currently a GraphQL request in-flight. For multi-part
   * requests like subscriptions, this will be `true` while fetching the
   * first partial response and `false` while fetching subsequent batches.
   */
  isFetching: boolean;
  /**
   * If there is currently a GraphQL request in-flight. For multi-part
   * requests like subscriptions, this will be `true` until the last batch
   * has been fetched or the connection is closed from the client.
   */
  isSubscribed: boolean;
  /**
   * The operation name that will be sent with all GraphQL requests.
   */
  operationName: string | null;
  /**
   * Start a GraphQL requests based of the current editor contents.
   */
  run(): void;
  /**
   * Stop the GraphQL request that is currently in-flight.
   */
  stop(): void;
};

export const ExecutionContext =
  createNullableContext<ExecutionContextType>('ExecutionContext');

export type ExecutionContextProviderProps = Pick<
  UseAutoCompleteLeafsArgs,
  'getDefaultFieldNames'
> & {
  children: ReactNode;
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
  /**
   * This prop sets the operation name that is passed with a GraphQL request.
   */
  operationName?: string;
};

export function ExecutionContextProvider({
  fetcher,
  getDefaultFieldNames,
  children,
  operationName,
}: ExecutionContextProviderProps) {
  if (!fetcher) {
    throw new TypeError(
      'The `ExecutionContextProvider` component requires a `fetcher` function to be passed as prop.',
    );
  }

  const {
    externalFragments,
    headerEditor,
    queryEditor,
    responseEditor,
    variableEditor,
    updateActiveTabValues,
  } = useEditorContext({ nonNull: true, caller: ExecutionContextProvider });
  const history = useHistoryContext();
  const autoCompleteLeafs = useAutoCompleteLeafs({
    getDefaultFieldNames,
    caller: ExecutionContextProvider,
  });
  const [isFetching, setIsFetching] = useState(false);
  const [subscription, setSubscription] = useState<Unsubscribable | null>(null);
  const queryIdRef = useRef(0);

  const stop = () => {
    subscription?.unsubscribe();
    setIsFetching(false);
    setSubscription(null);
  };

  const run: ExecutionContextType['run'] = async () => {
    if (!queryEditor || !responseEditor) {
      return;
    }

    // If there's an active subscription, unsubscribe it and return
    if (subscription) {
      stop();
      return;
    }

    const setResponse = (value: string) => {
      responseEditor.setValue(value);
      updateActiveTabValues({ response: value });
    };

    queryIdRef.current += 1;
    const queryId = queryIdRef.current;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    let query = autoCompleteLeafs() || queryEditor.getValue();

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
    setIsFetching(true);

    const opName = operationName ?? queryEditor.operationName ?? undefined;

    history?.addToHistory({
      query,
      variables: variablesString,
      headers: headersString,
      operationName: opName,
    });
    const _headers = headers ?? undefined;
    const documentAST = queryEditor.documentAST ?? undefined;
    try {
      const fullResponse: ExecutionResult = {};
      const handleResponse = (result: ExecutionResult) => {
        // A different query was dispatched in the meantime, so don't
        // show the results of this one.
        if (queryId !== queryIdRef.current) {
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

          setIsFetching(false);
          setResponse(formatResult(fullResponse));
        } else {
          const response = formatResult(result);
          setIsFetching(false);
          setResponse(response);
        }
      };

      const fetch = fetcher(
        {
          query,
          variables,
          operationName: opName,
        },
        {
          headers: _headers,
          documentAST,
        },
      );

      const value = await Promise.resolve(fetch);
      if (isObservable(value)) {
        // If the fetcher returned an Observable, then subscribe to it, calling
        // the callback on each next value, and handling both errors and the
        // completion of the Observable.
        setSubscription(
          value.subscribe({
            next(result) {
              handleResponse(result);
            },
            error(error: Error) {
              setIsFetching(false);
              if (error) {
                setResponse(formatError(error));
              }
              setSubscription(null);
            },
            complete() {
              setIsFetching(false);
              setSubscription(null);
            },
          }),
        );
      } else if (isAsyncIterable(value)) {
        setSubscription({
          unsubscribe: () => value[Symbol.asyncIterator]().return?.(),
        });
        await handleAsyncResults(handleResponse, value);
        setIsFetching(false);
        setSubscription(null);
      } else {
        handleResponse(value);
      }
    } catch (error) {
      setIsFetching(false);
      setResponse(formatError(error));
      setSubscription(null);
    }
  };

  const isSubscribed = Boolean(subscription);
  const value: ExecutionContextType = {
    isFetching,
    isSubscribed,
    operationName: operationName ?? null,
    run,
    stop,
  };

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
}

// Extract function because react-compiler doesn't support `for await` yet
async function handleAsyncResults(
  onResponse: (result: ExecutionResult) => void,
  value: any,
): Promise<void> {
  for await (const result of value) {
    onResponse(result);
  }
}

export const useExecutionContext = createContextHook(ExecutionContext);

function tryParseJsonObject({
  json,
  errorMessageParse,
  errorMessageType,
}: {
  json: string | undefined;
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
