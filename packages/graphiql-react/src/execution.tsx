import {
  Fetcher,
  FetcherResultPayload,
  formatError,
  formatResult,
  isAsyncIterable,
  isObservable,
  Unsubscribable,
} from '@graphiql/toolkit';
import {
  ExecutionResult,
  FragmentDefinitionNode,
  parse,
  print,
  visit,
} from 'graphql';
import { getFragmentDependenciesForAST } from 'graphql-language-service';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import setValue from 'set-value';

import { useAutoCompleteLeafs, useEditorContext } from './editor';
import { EditCallback } from './editor/hooks';
import { useHistoryContext } from './history';
import { createContextHook, createNullableContext } from './utility/context';

export type ExecutionContextType = {
  isFetching: boolean;
  run(selectedOperationName?: string): void;
  stop(): void;
  subscription: Unsubscribable | null;
};

export const ExecutionContext = createNullableContext<ExecutionContextType>(
  'ExecutionContext',
);

type ExecutionContextProviderProps = {
  children: ReactNode;
  externalFragments?: FragmentDefinitionNode[] | string;
  fetcher: Fetcher;
  onEditOperationName?: EditCallback;
  shouldPersistHeaders?: boolean;
};

export function ExecutionContextProvider(props: ExecutionContextProviderProps) {
  const {
    headerEditor,
    queryEditor,
    responseEditor,
    variableEditor,
    updateActiveTabValues,
  } = useEditorContext({ nonNull: true, caller: ExecutionContextProvider });
  const history = useHistoryContext();
  const autoCompleteLeafs = useAutoCompleteLeafs({
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

  const {
    externalFragments,
    fetcher,
    onEditOperationName,
    shouldPersistHeaders,
  } = props;
  const run = useCallback<ExecutionContextType['run']>(
    async _selectedOperationName => {
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

      const selectedOperationName =
        _selectedOperationName ||
        // If no operation name is provided explicitly then try to derive it
        // from the current cursor position
        (() => {
          if (!queryEditor.operations || !queryEditor.hasFocus()) {
            return undefined;
          }

          const cursorIndex = queryEditor.indexFromPos(queryEditor.getCursor());

          // Loop through all operations to see if one contains the cursor.
          for (const operation of queryEditor.operations) {
            if (
              operation.loc &&
              operation.loc.start <= cursorIndex &&
              operation.loc.end >= cursorIndex
            ) {
              return operation.name?.value;
            }
          }

          return undefined;
        })();

      let operationName = queryEditor.operationName;
      if (selectedOperationName && selectedOperationName !== operationName) {
        // If an operation was explicitly provided, different from the current
        // operation name, then report that it changed.
        operationName = selectedOperationName;

        queryEditor.operationName = selectedOperationName;
        updateActiveTabValues({ operationName: selectedOperationName });
        onEditOperationName?.(selectedOperationName);
      }

      if (externalFragments) {
        const externalFragmentsMap = new Map<string, FragmentDefinitionNode>();

        if (Array.isArray(externalFragments)) {
          externalFragments.forEach(def => {
            externalFragmentsMap.set(def.name.value, def);
          });
        } else {
          visit(parse(externalFragments, {}), {
            FragmentDefinition(def) {
              externalFragmentsMap.set(def.name.value, def);
            },
          });
        }

        const fragmentDependencies = queryEditor.documentAST
          ? getFragmentDependenciesForAST(
              queryEditor.documentAST,
              externalFragmentsMap,
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

      history?.addToHistory({
        query,
        variables: variablesString,
        headers: headersString,
        operationName: operationName ?? undefined,
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
              ...maybeMultipart
                .map(i => i.errors)
                .flat()
                .filter(Boolean),
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
                payload.data = part.data;
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
            operationName: queryEditor.operationName,
          },
          {
            headers: headers ?? undefined,
            shouldPersistHeaders,
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

          try {
            for await (const result of value) {
              handleResponse(result);
            }
            setIsFetching(false);
            setSubscription(null);
          } catch (error) {
            setIsFetching(false);
            setResponse(formatError(error));
            setSubscription(null);
          }
        } else {
          handleResponse(value);
        }
      } catch (error) {
        setIsFetching(false);
        setResponse(formatError(error));
        setSubscription(null);
      }
    },
    [
      autoCompleteLeafs,
      externalFragments,
      fetcher,
      headerEditor,
      history,
      onEditOperationName,
      queryEditor,
      responseEditor,
      shouldPersistHeaders,
      stop,
      subscription,
      updateActiveTabValues,
      variableEditor,
    ],
  );

  const value = useMemo<ExecutionContextType>(
    () => ({ isFetching, run, stop, subscription }),
    [isFetching, run, stop, subscription],
  );

  return (
    <ExecutionContext.Provider value={value}>
      {props.children}
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
  let parsed: Record<string, any> | undefined = undefined;
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
