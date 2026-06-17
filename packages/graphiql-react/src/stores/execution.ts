import {
  Fetcher,
  fillLeafs,
  formatError,
  formatResult,
  GetDefaultFieldNamesFn,
  HttpMethod,
  isAsyncIterable,
  isObservable,
  Transport,
  TransportResponse,
  Unsubscribable,
} from '@graphiql/toolkit';
import { ExecutionResult, GraphQLError, print } from 'graphql';
import { getFragmentDependenciesForAST } from 'graphql-language-service';
import setValue from 'set-value';
import getValue from 'get-value';

import type { StateCreator } from 'zustand';
import { tryParseJSONC } from '../utility';
import { Range } from '../utility/monaco-ssr';
import { STORAGE_KEY } from '../constants';
import type { SlicesWithActions, MonacoEditor } from '../types';

export type ResponseView = 'json' | 'tree' | 'table';

const RESPONSE_VIEWS: readonly ResponseView[] = ['json', 'tree', 'table'];

const byteLength = (value: string): number =>
  typeof TextEncoder === 'undefined'
    ? value.length
    : new TextEncoder().encode(value).length;

/**
 * Build a `TransportResponse` for the `Fetcher` path, where HTTP status and
 * headers are unobservable (the contract does not carry them). We populate
 * what we can measure from the JS side: timing and the formatted-body size.
 */
function buildFetcherFallbackResponse(
  body: ExecutionResult,
  startMs: number,
  formattedBody: string,
): TransportResponse {
  const errors = (body as { errors?: unknown } | null)?.errors;
  return {
    ok: !Array.isArray(errors) || errors.length === 0,
    body,
    timing: { totalMs: Date.now() - startMs },
    size: { response: byteLength(formattedBody) },
  };
}

function buildErrorResponse(
  errorText: string,
  startMs: number,
): TransportResponse {
  return {
    ok: false,
    body: {
      errors: [{ message: errorText }],
    } as unknown as ExecutionResult,
    timing: { totalMs: Date.now() - startMs },
    size: { response: byteLength(errorText) },
  };
}

export function isResponseView(value: unknown): value is ResponseView {
  return (
    typeof value === 'string' && RESPONSE_VIEWS.includes(value as ResponseView)
  );
}

export interface ExecutionSlice {
  /**
   * If there is currently a GraphQL request in-flight. For multipart
   * requests like subscriptions, this will be `true` while fetching the
   * first partial response and `false` while fetching subsequent batches.
   * @default false
   */
  isFetching: boolean;

  /**
   * The full `TransportResponse` envelope from the most recent completed
   * request. With a `Transport`, this carries the real HTTP wire metadata
   * (status, headers, timing, size). With a `Fetcher`, only `timing` and
   * `size.response` can be populated; status/headers are unavailable
   * because the `Fetcher` contract does not carry them.
   * `null` before any request runs.
   *
   * @default null
   */
  lastResponse: TransportResponse | null;

  /**
   * Which view is active in the response pane.
   * @default 'json'
   */
  responseView: ResponseView;

  /**
   * Whether the user has dismissed the upgrade-to-`transport` banner in the
   * response pane. Persisted to storage; honored by the response pane to
   * decide whether to render any header at all in the `fetcher` path.
   * @default false
   */
  transportUpgradeBannerDismissed: boolean;

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
  overrideOperationName: string | null;

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
   * @deprecated Pass a `transport` instead. The `Fetcher` contract cannot
   * surface HTTP wire metadata (status, headers, timing, size). See
   * `docs/migration/graphiql-6.0.0.md`.
   */
  fetcher?: Fetcher;

  /**
   * A `Transport` performs the GraphQL request and returns a `TransportResponse`
   * carrying the parsed body plus the real HTTP wire metadata (status, headers,
   * timing, size). Mutually exclusive with `fetcher`.
   */
  transport?: Transport;

  /**
   * The currently active HTTP method as tracked in the store. Mirrors
   * `transport.method` and updated via `setTransportMethod` so that
   * consumers re-render when the method changes. `null` when using a
   * fetcher (which has no observable method).
   *
   * @default null
   */
  transportMethod: HttpMethod | null;
}

export interface ExecutionActions {
  /**
   * Start a GraphQL request based on the current editor contents.
   */
  run(): void;

  /**
   * Stop the GraphQL request that is currently in-flight.
   */
  stop(): void;

  /**
   * Change which view is shown in the response pane.
   */
  setResponseView(view: ResponseView): void;

  /**
   * Mark the upgrade-to-`transport` banner as dismissed and persist the choice.
   */
  dismissTransportUpgradeBanner(): void;

  /**
   * Switch the HTTP method used by subsequent requests and re-render
   * consumers that read `transportMethod`. Only valid when `transport`
   * is configured and `transport.supportedMethods` has more than one entry.
   */
  setTransportMethod(method: HttpMethod): void;
}

type BaseExecutionProps = {
  /**
   * This prop sets the operation name that is passed with a GraphQL request.
   */
  operationName?: string;
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
};

/**
 * Pass exactly one of `fetcher` or `transport`. The two are mutually exclusive
 * at the type level; passing both is a compile error.
 *
 * Prefer `transport`: it lets GraphiQL surface real HTTP wire metadata
 * (status, headers, timing, size) in the response pane. `fetcher` is
 * deprecated, but continues to work for existing code.
 */
export type ExecutionProps = BaseExecutionProps &
  (
    | {
        /**
         * @deprecated Use `transport` instead. See
         * `docs/migration/graphiql-6.0.0.md`.
         */
        fetcher: Fetcher;
        transport?: never;
      }
    | { transport: Transport; fetcher?: never }
  );

type CreateExecutionSlice = (
  initial: Pick<
    ExecutionSlice,
    'overrideOperationName' | 'getDefaultFieldNames' | 'fetcher' | 'transport'
  >,
) => StateCreator<
  SlicesWithActions,
  [],
  [],
  ExecutionSlice & {
    actions: ExecutionActions;
  }
>;

export const createExecutionSlice: CreateExecutionSlice =
  initial => (set, get) => {
    function getAutoCompleteLeafs() {
      const { queryEditor, schema, getDefaultFieldNames } = get();
      if (!queryEditor) {
        return;
      }
      const query = queryEditor.getValue();
      const { insertions, result = '' } = fillLeafs(
        schema,
        query,
        getDefaultFieldNames,
      );
      if (!insertions.length) {
        return result;
      }
      const model = queryEditor.getModel()!;

      // Save the current cursor position as an offset
      const selection = queryEditor.getSelection()!;
      const cursorIndex = model.getOffsetAt(selection.getPosition());

      // Replace entire content
      model.setValue(result);

      let added = 0;
      const decorations = insertions.map(({ index, string }) => {
        const start = model.getPositionAt(index + added);
        const end = model.getPositionAt(index + (added += string.length));
        return {
          range: new Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column,
          ),
          options: {
            className: 'auto-inserted-leaf',
            hoverMessage: { value: 'Automatically added leaf fields' },
            isWholeLine: false,
          },
        };
      });

      // Create a decoration collection (initially empty)
      const decorationCollection = queryEditor.createDecorationsCollection([]);

      // Apply decorations
      decorationCollection.set(decorations);

      // Clear decorations after 7 seconds
      setTimeout(() => {
        decorationCollection.clear();
      }, 7000);

      // Adjust the cursor position based on insertions
      let newCursorIndex = cursorIndex;
      for (const { index, string } of insertions) {
        if (index < cursorIndex) {
          newCursorIndex += string.length;
        }
      }

      const newCursorPosition = model.getPositionAt(newCursorIndex);
      queryEditor.setPosition(newCursorPosition);

      return result;
    }

    return {
      ...initial,
      isFetching: false,
      lastResponse: null,
      responseView: 'json' as ResponseView,
      transportUpgradeBannerDismissed: false,
      subscription: null,
      queryId: 0,
      transportMethod: initial.transport?.method ?? null,
      actions: {
        setResponseView(view: ResponseView) {
          const { storage } = get();
          storage.set(STORAGE_KEY.responseView, view);
          set({ responseView: view });
        },
        dismissTransportUpgradeBanner() {
          const { storage } = get();
          storage.set(STORAGE_KEY.transportUpgradeBannerDismissed, 'true');
          set({ transportUpgradeBannerDismissed: true });
        },
        setTransportMethod(method: HttpMethod) {
          const { transport } = get();
          if (!transport?.setMethod) {
            return;
          }
          transport.setMethod(method);
          set({ transportMethod: method });
        },
        stop() {
          set(({ subscription }) => {
            subscription?.unsubscribe();
            return { isFetching: false, subscription: null };
          });
        },
        async run() {
          const {
            externalFragments,
            headerEditor,
            queryEditor,
            responseEditor,
            variableEditor,
            actions,
            operationName,
            documentAST,
            subscription,
            overrideOperationName,
            queryId,
            fetcher,
            transport,
          } = get();
          if (!queryEditor || !responseEditor) {
            return;
          }
          // If there's an active subscription, unsubscribe it and return
          if (subscription) {
            actions.stop();
            return;
          }

          function setResponse(value: string): void {
            responseEditor?.setValue(value);
            actions.updateActiveTabValues({ response: value });
          }

          function setError(error: Error, editor?: MonacoEditor): void {
            if (!editor) {
              return;
            }
            const name =
              editor === variableEditor ? 'Variables' : 'Request headers';
            // Need to format since the response editor uses `json` language
            setResponse(formatError({ message: `${name} ${error.message}` }));
          }

          const newQueryId = queryId + 1;
          set({ queryId: newQueryId });

          // Use the edited query after autoCompleteLeafs() runs or,
          // in case autoCompletion fails (the function returns undefined),
          // the current query from the editor.
          let query = getAutoCompleteLeafs() || queryEditor.getValue();

          let variables: Record<string, unknown> | undefined;
          try {
            variables = tryParseJSONC(variableEditor?.getValue());
          } catch (error) {
            setError(error as Error, variableEditor);
            return;
          }
          let headers: Record<string, unknown> | undefined;
          try {
            headers = tryParseJSONC(headerEditor?.getValue());
          } catch (error) {
            setError(error as Error, headerEditor);
            return;
          }
          const fragmentDependencies = documentAST
            ? getFragmentDependenciesForAST(documentAST, externalFragments)
            : [];
          if (fragmentDependencies.length) {
            query +=
              '\n' + fragmentDependencies.map(node => print(node)).join('\n');
          }

          setResponse('');
          set({ isFetching: true });
          const fetchStartMs = Date.now();
          try {
            const fullResponse: ExecutionResult = {};
            const handleResponse = (
              result: ExecutionResult,
              envelope?: TransportResponse,
            ) => {
              // A different query was dispatched in the meantime, so don't
              // show the results of this one.
              if (newQueryId !== get().queryId) {
                return;
              }

              let maybeMultipart = Array.isArray(result) ? result : false;
              if (
                !maybeMultipart &&
                typeof result === 'object' &&
                'hasNext' in result
              ) {
                maybeMultipart = [result];
              }

              let formattedBody: string;
              let mergedBody: ExecutionResult;
              if (maybeMultipart) {
                for (const part of maybeMultipart) {
                  mergeIncrementalResult(fullResponse, part);
                }
                mergedBody = fullResponse;
                formattedBody = formatResult(fullResponse);
              } else {
                mergedBody = result;
                formattedBody = formatResult(result);
              }

              set({
                isFetching: false,
                lastResponse:
                  envelope ??
                  buildFetcherFallbackResponse(
                    mergedBody,
                    fetchStartMs,
                    formattedBody,
                  ),
              });
              setResponse(formattedBody);
            };
            const opName = overrideOperationName ?? operationName;

            if (transport) {
              const result = transport.send({
                query,
                variables,
                operationName: opName,
                headers: headers as Record<string, string> | undefined,
              });

              if (isAsyncIterable(result)) {
                const iter = result as AsyncIterable<TransportResponse>;
                const newSubscription = {
                  unsubscribe: () => iter[Symbol.asyncIterator]().return?.(),
                };
                set({ subscription: newSubscription });
                for await (const tr of iter) {
                  handleResponse(tr.body as ExecutionResult, tr);
                }
                set({ isFetching: false, subscription: null });
              } else {
                const tr = await result;
                handleResponse(tr.body as ExecutionResult, tr);
              }
            } else if (fetcher) {
              const fetch = fetcher(
                { query, variables, operationName: opName },
                { headers, documentAST },
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
                    const errorText = formatError(error);
                    set({
                      isFetching: false,
                      lastResponse: buildErrorResponse(errorText, fetchStartMs),
                      subscription: null,
                    });
                    setResponse(errorText);
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
            } else {
              throw new Error(
                'No fetcher or transport configured on `GraphiQLProvider`.',
              );
            }
          } catch (error) {
            const errorText = formatError(error);
            set({
              isFetching: false,
              lastResponse: buildErrorResponse(errorText, fetchStartMs),
              subscription: null,
            });
            setResponse(errorText);
          }
        },
      },
    };
  };

interface IncrementalResult {
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
}

const pathsMap = new WeakMap<
  ExecutionResult,
  Map<string, ReadonlyArray<string | number>>
>();

/**
 * @param executionResult - The complete execution result object which will be
 * mutated by merging the contents of the incremental result.
 * @param incrementalResult - The incremental result that will be merged into the
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

  const { items, data, id } = incrementalResult;
  if (items) {
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
  if (data) {
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
    for (const { id: completedId, errors } of incrementalResult.completed) {
      pathsMap.get(executionResult)?.delete(completedId);
      if (errors) {
        executionResult.errors ||= [];
        (executionResult.errors as GraphQLError[]).push(...errors);
      }
    }
  }
}
