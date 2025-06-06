import { fillLeafs, mergeAst } from '@graphiql/toolkit';
import { print } from 'graphql';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: check why query builder update only 1st field https://github.com/graphql/graphiql/issues/3836
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { storageStore } from '../stores';
import { debounce } from './debounce';
import { formatJSONC } from './jsonc';
import { AllSlices, MonacoEditor } from '../types';
import { type editor as monacoEditor, Range } from '../monaco-editor';
import { useGraphiQL } from '../components';
import { pick } from './pick';

export function useSynchronizeValue(editor?: MonacoEditor, value?: string) {
  useEffect(() => {
    if (typeof value === 'string' && editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [editor, value]);
}

export function useChangeHandler(
  callback: ((value: string) => void) | undefined,
  storageKey: string | null,
  tabProperty: 'variables' | 'headers',
) {
  const { editor, updateActiveTabValues } = useGraphiQL(state => ({
    editor:
      state[tabProperty === 'variables' ? 'variableEditor' : 'headerEditor'],
    updateActiveTabValues: state.updateActiveTabValues,
  }));
  useEffect(() => {
    if (!editor) {
      return;
    }
    const { storage } = storageStore.getState();

    const store = debounce(500, (value: string) => {
      if (storageKey === null) {
        return;
      }
      storage.set(storageKey, value);
    });
    const updateTab = debounce(100, (value: string) => {
      updateActiveTabValues({ [tabProperty]: value });
    });

    const handleChange = (_event: monacoEditor.IModelContentChangedEvent) => {
      const newValue = editor.getValue();
      store(newValue);
      updateTab(newValue);
      callback?.(newValue);
    };
    const disposable = editor.getModel()!.onDidChangeContent(handleChange);
    return () => {
      disposable.dispose();
    };
  }, [callback, editor, storageKey, tabProperty, updateActiveTabValues]);
}

export function useMergeQuery() {
  const { queryEditor, documentAST, schema } = useGraphiQL(
    pick('queryEditor', 'documentAST', 'schema'),
  );
  return (): void => {
    const query = queryEditor?.getValue();
    if (!documentAST || !query) {
      return;
    }
    queryEditor!.setValue(print(mergeAst(documentAST, schema)));
  };
}

export function usePrettifyEditors() {
  const { queryEditor, headerEditor, variableEditor, onPrettifyQuery } =
    useGraphiQL(
      pick('queryEditor', 'headerEditor', 'variableEditor', 'onPrettifyQuery'),
    );

  return async (): Promise<void> => {
    if (variableEditor) {
      try {
        const content = variableEditor.getValue();
        const formatted = await formatJSONC(content);
        if (formatted !== content) {
          variableEditor.setValue(formatted);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          'Parsing variables JSON failed, skip prettification.',
          error,
        );
      }
    }

    if (headerEditor) {
      try {
        const content = headerEditor.getValue();
        const formatted = await formatJSONC(content);
        if (formatted !== content) {
          headerEditor.setValue(formatted);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          'Parsing headers JSON failed, skip prettification.',
          error,
        );
      }
    }

    if (!queryEditor) {
      return;
    }
    try {
      const content = queryEditor.getValue();
      const formatted = await onPrettifyQuery(content);
      if (formatted !== content) {
        queryEditor.setValue(formatted);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Parsing query failed, skip prettification.', error);
    }
  };
}

export function getAutoCompleteLeafs({
  queryEditor,
  schema,
  getDefaultFieldNames,
}: Pick<AllSlices, 'queryEditor' | 'schema' | 'getDefaultFieldNames'>) {
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

// https://react.dev/learn/you-might-not-need-an-effect
export const useEditorState = (
  editor: 'query' | 'variable' | 'header',
): [string, (val: string) => void] => {
  // eslint-disable-next-line react-hooks/react-compiler -- TODO: check why query builder update only 1st field https://github.com/graphql/graphiql/issues/3836
  'use no memo';
  const editorInstance = useGraphiQL(state => state[`${editor}Editor`]);
  const editorValue = editorInstance?.getValue() ?? '';

  const handleChange = useCallback(
    (value: string) => editorInstance?.setValue(value),
    [editorInstance],
  );
  return useMemo(
    () => [editorValue, handleChange],
    [editorValue, handleChange],
  );
};

/**
 * useState-like hook for the current tab operations editor state
 */
export const useOperationsEditorState = (): [
  operations: string,
  setOperations: (content: string) => void,
] => {
  return useEditorState('query');
};

/**
 * useState-like hook for current tab variables editor state
 */
export const useVariablesEditorState = (): [
  variables: string,
  setVariables: (content: string) => void,
] => {
  return useEditorState('variable');
};

/**
 * useState-like hook for current tab variables editor state
 */
export const useHeadersEditorState = (): [
  headers: string,
  setHeaders: (content: string) => void,
] => {
  return useEditorState('header');
};

/**
 * Implements an optimistic caching strategy around a useState-like hook in
 * order to prevent loss of updates when the hook has an internal delay and the
 * update function is called again before the updated state is sent out.
 *
 * Use this as a wrapper around `useOperationsEditorState`,
 * `useVariablesEditorState`, or `useHeadersEditorState` if you anticipate
 * calling them with great frequency (due to, for instance, mouse, keyboard, or
 * network events).
 *
 * @example
 * ```ts
 * const [operationsString, handleEditOperations] =
 *   useOptimisticState(useOperationsEditorState());
 * ```
 */
export function useOptimisticState([
  upstreamState,
  upstreamSetState,
]: ReturnType<typeof useEditorState>): ReturnType<typeof useEditorState> {
  const lastStateRef = useRef({
    /** The last thing that we sent upstream; we're expecting this back */
    pending: null as string | null,
    /** The last thing we received from upstream */
    last: upstreamState,
  });

  const [state, setOperationsText] = useState(upstreamState);

  useEffect(() => {
    if (lastStateRef.current.last === upstreamState) {
      // No change; ignore
      return;
    }
    lastStateRef.current.last = upstreamState;
    if (lastStateRef.current.pending === null) {
      // Gracefully accept update from upstream
      setOperationsText(upstreamState);
      return;
    }
    if (lastStateRef.current.pending === upstreamState) {
      // They received our update and sent it back to us - clear pending, and
      // send next if appropriate
      lastStateRef.current.pending = null;
      if (upstreamState !== state) {
        // Change has occurred; upstream it
        lastStateRef.current.pending = state;
        upstreamSetState(state);
      }
      return;
    }
    // They got a different update; overwrite our local state (!!)
    lastStateRef.current.pending = null;
    setOperationsText(upstreamState);
  }, [upstreamState, state, upstreamSetState]);

  const setState = (newState: string) => {
    setOperationsText(newState);
    if (
      lastStateRef.current.pending === null &&
      lastStateRef.current.last !== newState
    ) {
      // No pending updates and change has occurred... send it upstream
      lastStateRef.current.pending = newState;
      upstreamSetState(newState);
    }
  };

  return [state, setState];
}
