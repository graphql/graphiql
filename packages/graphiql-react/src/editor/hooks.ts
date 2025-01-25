import { fillLeafs, GetDefaultFieldNamesFn, mergeAst } from '@graphiql/toolkit';
import type { EditorChange, EditorConfiguration } from 'codemirror';
import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import copyToClipboard from 'copy-to-clipboard';
import { parse, print } from 'graphql';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: check why query builder update only 1st field https://github.com/graphql/graphiql/issues/3836
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useExplorerContext } from '../explorer';
import { usePluginContext } from '../plugin';
import { useSchemaContext } from '../schema';
import { useStorageContext } from '../storage';
import debounce from '../utility/debounce';
import { onHasCompletion } from './completion';
import { useEditorContext } from './context';
import { CodeMirrorEditor } from './types';

export function useSynchronizeValue(
  editor: CodeMirrorEditor | null,
  value?: string,
) {
  useEffect(() => {
    if (editor && typeof value === 'string' && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [editor, value]);
}

export function useSynchronizeOption<K extends keyof EditorConfiguration>(
  editor: CodeMirrorEditor | null,
  option: K,
  value: EditorConfiguration[K],
) {
  useEffect(() => {
    if (editor) {
      editor.setOption(option, value);
    }
  }, [editor, option, value]);
}

export function useChangeHandler(
  editor: CodeMirrorEditor | null,
  callback: ((value: string) => void) | undefined,
  storageKey: string | null,
  tabProperty: 'variables' | 'headers',
  caller: Function,
) {
  const { updateActiveTabValues } = useEditorContext({ nonNull: true, caller });
  const storage = useStorageContext();

  useEffect(() => {
    if (!editor) {
      return;
    }

    const store = debounce(500, (value: string) => {
      if (!storage || storageKey === null) {
        return;
      }
      storage.set(storageKey, value);
    });

    const updateTab = debounce(100, (value: string) => {
      updateActiveTabValues({ [tabProperty]: value });
    });

    const handleChange = (
      editorInstance: CodeMirrorEditor,
      changeObj?: EditorChange,
    ) => {
      // When we signal a change manually without actually changing anything
      // we don't want to invoke the callback.
      if (!changeObj) {
        return;
      }

      const newValue = editorInstance.getValue();
      store(newValue);
      updateTab(newValue);
      callback?.(newValue);
    };
    editor.on('change', handleChange);
    return () => editor.off('change', handleChange);
  }, [
    callback,
    editor,
    storage,
    storageKey,
    tabProperty,
    updateActiveTabValues,
  ]);
}

export function useCompletion(
  editor: CodeMirrorEditor | null,
  callback: ((reference: SchemaReference) => void) | null,
  caller: Function,
) {
  const { schema } = useSchemaContext({ nonNull: true, caller });
  const explorer = useExplorerContext();
  const plugin = usePluginContext();
  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleCompletion = (
      instance: CodeMirrorEditor,
      changeObj?: EditorChange,
    ) => {
      onHasCompletion(instance, changeObj, schema, explorer, plugin, type => {
        callback?.({ kind: 'Type', type, schema: schema || undefined });
      });
    };
    editor.on(
      // @ts-expect-error @TODO additional args for hasCompletion event
      'hasCompletion',
      handleCompletion,
    );
    return () =>
      editor.off(
        // @ts-expect-error @TODO additional args for hasCompletion event
        'hasCompletion',
        handleCompletion,
      );
  }, [callback, editor, explorer, plugin, schema]);
}

type EmptyCallback = () => void;

export function useKeyMap(
  editor: CodeMirrorEditor | null,
  keys: string[],
  callback?: EmptyCallback,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }
    for (const key of keys) {
      editor.removeKeyMap(key);
    }

    if (callback) {
      const keyMap: Record<string, EmptyCallback> = {};
      for (const key of keys) {
        keyMap[key] = () => callback();
      }
      editor.addKeyMap(keyMap);
    }
  }, [editor, keys, callback]);
}

export type UseCopyQueryArgs = {
  /**
   * This is only meant to be used internally in `@graphiql/react`.
   */
  caller?: Function;
  /**
   * Invoked when the current contents of the query editor are copied to the
   * clipboard.
   * @param query The content that has been copied.
   */
  onCopyQuery?: (query: string) => void;
};

// To make react-compiler happy, otherwise complains about - Hooks may not be referenced as normal values
const _useCopyQuery = useCopyQuery;
const _useMergeQuery = useMergeQuery;
const _usePrettifyEditors = usePrettifyEditors;
const _useAutoCompleteLeafs = useAutoCompleteLeafs;

export function useCopyQuery({ caller, onCopyQuery }: UseCopyQueryArgs = {}) {
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: caller || _useCopyQuery,
  });
  return () => {
    if (!queryEditor) {
      return;
    }

    const query = queryEditor.getValue();
    copyToClipboard(query);

    onCopyQuery?.(query);
  };
}

type UseMergeQueryArgs = {
  /**
   * This is only meant to be used internally in `@graphiql/react`.
   */
  caller?: Function;
};

export function useMergeQuery({ caller }: UseMergeQueryArgs = {}) {
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: caller || _useMergeQuery,
  });
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: _useMergeQuery,
  });
  return () => {
    const documentAST = queryEditor?.documentAST;
    const query = queryEditor?.getValue();
    if (!documentAST || !query) {
      return;
    }

    queryEditor.setValue(print(mergeAst(documentAST, schema)));
  };
}

type UsePrettifyEditorsArgs = {
  /**
   * This is only meant to be used internally in `@graphiql/react`.
   */
  caller?: Function;
};

// TEST see if have git setup
export function usePrettifyEditors({ caller }: UsePrettifyEditorsArgs = {}) {
  const { queryEditor, headerEditor, variableEditor } = useEditorContext({
    nonNull: true,
    caller: caller || _usePrettifyEditors,
  });
  return () => {
    if (variableEditor) {
      const variableEditorContent = variableEditor.getValue();
      try {
        const prettifiedVariableEditorContent = JSON.stringify(
          JSON.parse(variableEditorContent),
          null,
          2,
        );
        if (prettifiedVariableEditorContent !== variableEditorContent) {
          variableEditor.setValue(prettifiedVariableEditorContent);
        }
      } catch {
        /* Parsing JSON failed, skip prettification */
      }
    }

    if (headerEditor) {
      const headerEditorContent = headerEditor.getValue();

      try {
        const prettifiedHeaderEditorContent = JSON.stringify(
          JSON.parse(headerEditorContent),
          null,
          2,
        );
        if (prettifiedHeaderEditorContent !== headerEditorContent) {
          headerEditor.setValue(prettifiedHeaderEditorContent);
        }
      } catch {
        /* Parsing JSON failed, skip prettification */
      }
    }

    if (queryEditor) {
      const editorContent = queryEditor.getValue();
      const prettifiedEditorContent = print(parse(editorContent));

      if (prettifiedEditorContent !== editorContent) {
        queryEditor.setValue(prettifiedEditorContent);
      }
    }
  };
}

export type UseAutoCompleteLeafsArgs = {
  /**
   * A function to determine which field leafs are automatically added when
   * trying to execute a query with missing selection sets. It will be called
   * with the `GraphQLType` for which fields need to be added.
   */
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
  /**
   * This is only meant to be used internally in `@graphiql/react`.
   */
  caller?: Function;
};

export function useAutoCompleteLeafs({
  getDefaultFieldNames,
  caller,
}: UseAutoCompleteLeafsArgs = {}) {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: caller || _useAutoCompleteLeafs,
  });
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: caller || _useAutoCompleteLeafs,
  });
  return () => {
    if (!queryEditor) {
      return;
    }

    const query = queryEditor.getValue();
    const { insertions, result } = fillLeafs(
      schema,
      query,
      getDefaultFieldNames,
    );
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

    return result;
  };
}

// https://react.dev/learn/you-might-not-need-an-effect

export const useEditorState = (editor: 'query' | 'variable' | 'header') => {
  'use no memo'; // eslint-disable-line react-compiler/react-compiler -- TODO: check why query builder update only 1st field https://github.com/graphql/graphiql/issues/3836
  const context = useEditorContext({
    nonNull: true,
  });

  const editorInstance = context[`${editor}Editor` as const];
  let valueString = '';
  const editorValue = editorInstance?.getValue() ?? false;
  if (editorValue && editorValue.length > 0) {
    valueString = editorValue;
  }

  const handleEditorValue = useCallback(
    (value: string) => editorInstance?.setValue(value),
    [editorInstance],
  );
  return useMemo<[string, (val: string) => void]>(
    () => [valueString, handleEditorValue],
    [valueString, handleEditorValue],
  );
};

/**
 * useState-like hook for current tab operations editor state
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
 * Example:
 *
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
    } else {
      lastStateRef.current.last = upstreamState;
      if (lastStateRef.current.pending === null) {
        // Gracefully accept update from upstream
        setOperationsText(upstreamState);
      } else if (lastStateRef.current.pending === upstreamState) {
        // They received our update and sent it back to us - clear pending, and
        // send next if appropriate
        lastStateRef.current.pending = null;
        if (upstreamState !== state) {
          // Change has occurred; upstream it
          lastStateRef.current.pending = state;
          upstreamSetState(state);
        }
      } else {
        // They got a different update; overwrite our local state (!!)
        lastStateRef.current.pending = null;
        setOperationsText(upstreamState);
      }
    }
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
