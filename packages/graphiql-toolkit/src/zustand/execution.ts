import { GraphiQLState, ImmerStateCreator } from './store';

import {
  createGraphiQLFetcher,
  Fetcher,
  fillLeafs,
  formatError,
  formatResult,
  isAsyncIterable,
  isObservable,
  Unsubscribable,
} from '../';

import {
  ExecutionResult,
  FragmentDefinitionNode,
  GraphQLError,
  print,
} from 'graphql';
import { getFragmentDependenciesForAST } from 'graphql-language-service';
import setValue from 'set-value';
import getValue from 'get-value';
import { produce } from 'immer';

export type ExecutionState = {
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

  subscription: Unsubscribable | null;
  /**
   * The operation name that will be sent with all GraphQL requests.
   */
  operationName: string | null;

  /**
   * Start a Gr aphQL requests based of the current editor contents.
   */
  run(): void;
  /**
   * Stop the GraphQL request that is currently in-flight.
   */
  stop(): void;
  autocompleteLeafs(): string | undefined;
  fetcher: Fetcher;
  queryId: number;
};

const pathsMap = new WeakMap<
  ExecutionResult,
  Map<string, ReadonlyArray<string | number>>
>();

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
        // eslint-disable-next-line unicorn/prefer-at -- cannot mutate the array using Array.at()
        (path[path.length - 1] as number)++;
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

export const executionSlice: ImmerStateCreator<ExecutionState> = (
  set,
  get,
) => ({
  isFetching: false,
  isSubscribed: false,
  operationName: null,
  fetcher: createGraphiQLFetcher({ url: '/graphql' }),
  subscription: null,
  queryId: 0,
  setFetcher: (fetcher: Fetcher) => {
    set(
      produce((state: GraphiQLState) => {
        state.execution.fetcher = fetcher;
      }),
    );
  },

  run: async () => {
    const { queryEditor, responseEditor, variableEditor, headerEditor } =
      get().editor;
    if (!queryEditor || !responseEditor) {
      return;
    }

    const options = get().options;

    // If there's an active subscription, unsubscribe it and return
    if (get().execution.subscription) {
      stop();
      return;
    }

    const setResponse = (value: string) => {
      responseEditor.setValue(value);
      get().editor.updateActiveTabValues({ response: value });
    };

    set(
      produce(state => {
        state.execution.queryId += 1;
      }),
    );

    const queryId = get().execution.queryId;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    let query = get().execution.autocompleteLeafs() || queryEditor.getValue();

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

    if (options.externalFragments) {
      const fragmentDependencies = queryEditor.documentAST
        ? getFragmentDependenciesForAST(
            queryEditor.documentAST,
            options.externalFragments,
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
    set(
      produce((state: GraphiQLState) => {
        state.execution.isFetching = true;
      }),
    );
    setResponse('');

    const opName =
      get().execution.operationName ?? queryEditor.operationName ?? undefined;

    // TODO: move this to a plugin later
    // history?.addToHistory({
    //   query,
    //   variables: variablesString,
    //   headers: headersString,
    //   operationName: opName,
    // });

    try {
      const fullResponse: ExecutionResult = {};
      const handleResponse = (result: ExecutionResult) => {
        // A different query was dispatched in the meantime, so don't
        // show the results of this one.
        if (queryId !== get().execution.queryId) {
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
          set(
            produce(state => {
              state.execution.isFetching = false;
            }),
          );
          setResponse(formatResult(fullResponse));
        } else {
          const response = formatResult(result);
          set(
            produce(state => {
              state.execution.isFetching = false;
            }),
          );
          setResponse(response);
        }
      };

      const fetch = options.fetcher(
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
        set(
          produce((state: GraphiQLState) => {
            state.execution.subscription = value.subscribe({
              next(result) {
                handleResponse(result);
              },
              error(error: Error) {
                set(
                  produce((state: GraphiQLState) => {
                    state.execution.isFetching = false;
                    state.execution.subscription = null;
                  }),
                );

                if (error) {
                  setResponse(formatError(error));
                }
              },
              complete() {
                set(
                  produce((state: GraphiQLState) => {
                    state.execution.isFetching = false;
                    state.execution.subscription = null;
                  }),
                );
              },
            });
          }),
        );
      } else if (isAsyncIterable(value)) {
        set(
          produce((state: GraphiQLState) => {
            state.execution.subscription = {
              unsubscribe: () => value[Symbol.asyncIterator]().return?.(),
            };
          }),
        );

        for await (const result of value) {
          handleResponse(result);
        }
        set(
          produce((state: GraphiQLState) => {
            state.execution.isFetching = false;
          }),
        );
        set(
          produce((state: GraphiQLState) => {
            state.execution.isFetching = false;
            state.execution.subscription = null;
          }),
        );
      } else {
        handleResponse(value);
      }
    } catch (error) {
      set(
        produce((state: GraphiQLState) => {
          state.execution.isFetching = true;
          state.execution.isSubscribed = false;
        }),
      );
      setResponse(formatError(error));
    }
  },
  stop: () => {
    set(
      produce((state: GraphiQLState) => {
        state.execution.isFetching = false;
      }),
    );
  },
  autocompleteLeafs: () => {
    let completionResult: string | undefined;
    set(state => {
      const { schema } = state.schema;
      const { queryEditor } = state.editor;

      if (!queryEditor) {
        return;
      }

      const query = queryEditor.getValue();
      const { insertions, result } = fillLeafs(
        // @ts-expect-error WriteableDraft error
        schema,
        query,
        get().options.getDefaultFieldNames,
      );
      completionResult = result;
      if (insertions && insertions.length > 0) {
        queryEditor.operation(() => {
          const cursor = queryEditor.getCursor();
          const cursorIndex = queryEditor.indexFromPos(cursor);
          queryEditor.setValue(result || '');
          let added = 0;
          const markers = insertions.map(({ index, string }) =>
            queryEditor.markText(
              queryEditor.posFromIndex(index + added),
              queryEditor.posFromIndex(index + (added += string.length)),
              {
                className: 'auto-inserted-leaf',
                clearOnEnter: true,
                title: 'Automatically added leaf fields',
              },
            ),
          );
          setTimeout(() => {
            for (const marker of markers) {
              marker.clear();
            }
          }, 7000);
          let newCursorIndex = cursorIndex;
          for (const { index, string } of insertions) {
            if (index < cursorIndex) {
              newCursorIndex += string.length;
            }
          }
          queryEditor.setCursor(queryEditor.posFromIndex(newCursorIndex));
        });
      }
    });
    return completionResult;
  },
});

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
