import {
  Fetcher,
  FetcherResultPayload,
  formatError,
  formatResult,
  isAsyncIterable,
  isObservable,
  Unsubscribable,
} from '@graphiql/toolkit';
import { ExecutionResult, FragmentDefinitionNode, print } from 'graphql';
import { getFragmentDependenciesForAST } from 'graphql-language-service';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import setValue from 'set-value';

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

  const stop = useCallback(() => {
    subscription?.unsubscribe();
    setIsFetching(false);
    setSubscription(null);
  }, [subscription]);

  const run = useCallback<ExecutionContextType['run']>(async () => {
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

    try {
      let fullResponse: FetcherResultPayload = { data: {} };
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
          const payload: FetcherResultPayload = {
            data: fullResponse.data,
          };
          const maybeErrors = [
            ...(fullResponse?.errors || []),
            ...maybeMultipart.flatMap(i => i.errors).filter(Boolean),
          ];

          if (maybeErrors.length) {
            payload.errors = maybeErrors;
          }

          for (const part of maybeMultipart) {
            // We pull out errors here, so we dont include it later
            const { path, data, errors, ...rest } = part;
            if (path) {
              if (!data) {
                throw new Error(
                  `Expected part to contain a data property, but got ${part}`,
                );
              }

              setValue(payload.data, path, data, { merge: true });
            } else if (data) {
              // If there is no path, we don't know what to do with the payload,
              // so we just set it.
              payload.data = data;
            }

            // Ensures we also bring extensions and alike along for the ride
            fullResponse = {
              ...payload,
              ...rest,
            };
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
          headers: headers ?? undefined,
          documentAST: queryEditor.documentAST ?? undefined,
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
        for await (const result of value) {
          handleResponse(result);
        }
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
  }, [
    autoCompleteLeafs,
    externalFragments,
    fetcher,
    headerEditor,
    history,
    operationName,
    queryEditor,
    responseEditor,
    stop,
    subscription,
    updateActiveTabValues,
    variableEditor,
  ]);

  const isSubscribed = Boolean(subscription);
  const value = useMemo<ExecutionContextType>(
    () => ({
      isFetching,
      isSubscribed,
      operationName: operationName ?? null,
      run,
      stop,
    }),
    [isFetching, isSubscribed, operationName, run, stop],
  );

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
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
