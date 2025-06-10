import {
  Fetcher,
  fillLeafs,
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
import setValue from 'set-value';
import getValue from 'get-value';

import type { StateCreator } from 'zustand';
import { formatJSONC, parseJSONC } from '../utility';
import { SlicesWithActions, MonacoEditor } from '../types';
import { Range } from '../monaco-editor';

export interface ExecutionSlice {
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
   * We suggest using the `createGraphiQLFetcher` utility from `@graphiql/toolkit`
   * to create these fetcher functions.
   *
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#creategraphiqlfetcher-2|`createGraphiQLFetcher`}
   */
  fetcher: Fetcher;
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
}

export interface ExecutionProps
  extends Pick<ExecutionSlice, 'getDefaultFieldNames' | 'fetcher'> {
  /**
   * This prop sets the operation name that is passed with a GraphQL request.
   */
  operationName?: string;
}

type CreateExecutionSlice = StateCreator<SlicesWithActions, [], [], ExecutionSlice>;

export const createExecutionSlice: CreateExecutionSlice = (set, get) => {
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
    isFetching: false,
    subscription: null,
    overrideOperationName: null,
    getDefaultFieldNames: undefined,
    queryId: 0,
    fetcher: null!,
    actions: {
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
          actions,
          operationName,
          documentAST,
          subscription,
          overrideOperationName,
          queryId,
          fetcher,
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

        function setError(error: unknown, editor?: MonacoEditor): void {
          if (!editor) {
            return;
          }
          let message;
          const name = editor === variableEditor ? 'Variables' : 'Headers';
          if (error instanceof TypeError) {
            message = `${name} are not a JSON object.`;
          } else {
            message = `${name} are invalid JSON: ${error instanceof Error ? error.message : error}.`;
          }
          // Need to stringify since the response editor uses `json` language
          setResponse(formatError({ message }));
        }

        const newQueryId = queryId + 1;
        set({ queryId: newQueryId });

        // Use the edited query after autoCompleteLeafs() runs or,
        // in case autoCompletion fails (the function returns undefined),
        // the current query from the editor.
        let query = getAutoCompleteLeafs() || queryEditor.getValue();

        let variables: Record<string, unknown> | undefined;
        try {
          variables = await tryParseJsonObject(variableEditor?.getValue());
        } catch (error) {
          setError(error, variableEditor);
          return;
        }
        let headers: Record<string, unknown> | undefined;
        try {
          headers = await tryParseJsonObject(headerEditor?.getValue());
        } catch (error) {
          setError(error, headerEditor);
          return;
        }
        const fragmentDependencies = documentAST
          ? getFragmentDependenciesForAST(documentAST, externalFragments)
          : [];
        if (fragmentDependencies.length > 0) {
          query +=
            '\n' +
            fragmentDependencies
              .map((node: FragmentDefinitionNode) => print(node))
              .join('\n');
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
          const opName = overrideOperationName ?? operationName;
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
                set({ isFetching: false });
                setResponse(formatError(error));
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
    },
  };
};

async function tryParseJsonObject(
  json = '',
): Promise<Record<string, unknown> | undefined> {
  // `jsonc-parser` doesn't support trailing commas,
  // so we need first to format with prettier, which will remove them
  const formatted = await formatJSONC(json);
  const parsed = parseJSONC(formatted);
  if (!parsed) {
    return;
  }
  const isObject = typeof parsed === 'object' && !Array.isArray(parsed);
  if (!isObject) {
    throw new TypeError();
  }
  return parsed;
}

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
