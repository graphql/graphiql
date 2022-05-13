import type { Editor, EditorChange } from 'codemirror';
import { useContext, useEffect, useRef } from 'react';

import { commonKeys, importCodeMirror } from './common';
import onHasCompletion from './completion';
import { EditorContext } from './context';

export type UseHeaderEditorArgs = {
  editorTheme?: string;
  onEdit?(value: string): void;
  onHintInformationRender?(value: HTMLDivElement): void;
  onPrettifyQuery?(value?: string): void;
  onMergeQuery?(value?: string): void;
  onRunQuery?(value?: string): void;
  readOnly?: boolean;
  value?: string;
};

export function useHeaderEditor({
  editorTheme = 'graphiql',
  onEdit,
  onHintInformationRender,
  onMergeQuery,
  onPrettifyQuery,
  onRunQuery,
  readOnly = false,
  value,
}: UseHeaderEditorArgs = {}) {
  const context = useContext(EditorContext);
  const ref = useRef<HTMLDivElement>(null);

  if (!context) {
    throw new Error(
      'Tried to call the `useHeaderEditor` hook without the necessary context. Make sure that the `EditorContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  const { headerEditor, setHeaderEditor } = context;

  useEffect(() => {
    importCodeMirror([
      // @ts-expect-error
      import('codemirror/mode/javascript/javascript'),
    ]).then(CodeMirror => {
      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        lineNumbers: true,
        tabSize: 2,
        mode: { name: 'javascript', json: true },
        theme: editorTheme,
        keyMap: 'sublime',
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: readOnly ? 'nocursor' : false,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: commonKeys,
      });

      newEditor.addKeyMap({
        'Cmd-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
        'Ctrl-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
        'Alt-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
        'Shift-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
      });

      newEditor.on('keyup', (editorInstance, event) => {
        const code = event.keyCode;
        if (
          (code >= 65 && code <= 90) || // letters
          (!event.shiftKey && code >= 48 && code <= 57) || // numbers
          (event.shiftKey && code === 189) || // underscore
          (event.shiftKey && code === 222) // "
        ) {
          editorInstance.execCommand('autocomplete');
        }
      });

      setHeaderEditor(newEditor);
    });
  }, [editorTheme, readOnly, setHeaderEditor]);

  /**
   * Handle setting value (controlled component)
   */
  useEffect(() => {
    if (headerEditor && typeof value !== 'undefined') {
      if (value !== headerEditor.getValue()) {
        headerEditor.setValue(value);
      }
    }
  }, [headerEditor, value]);

  /**
   * Handle callback for change
   */
  useEffect(() => {
    if (!headerEditor) {
      return;
    }

    const handleChange = (editorInstance: Editor) => {
      const newValue = editorInstance.getValue();
      onEdit?.(newValue);
    };
    headerEditor.on('change', handleChange);
    return () => headerEditor.off('change', handleChange);
  }, [headerEditor, onEdit]);

  /**
   * Handle completion
   */
  useEffect(() => {
    if (headerEditor && onHintInformationRender) {
      const handleCompletion = (instance: Editor, changeObj?: EditorChange) => {
        onHasCompletion(instance, changeObj, onHintInformationRender);
      };
      headerEditor.on(
        // @ts-expect-error
        'hasCompletion',
        handleCompletion,
      );
      return () =>
        headerEditor.off(
          // @ts-expect-error
          'hasCompletion',
          handleCompletion,
        );
    }
  }, [headerEditor, onHintInformationRender]);

  /**
   * Handle callback for query execution
   */
  useEffect(() => {
    if (!headerEditor) {
      return;
    }
    headerEditor.removeKeyMap('Cmd-Enter');
    headerEditor.removeKeyMap('Ctrl-Enter');

    if (onRunQuery) {
      headerEditor.addKeyMap({
        'Cmd-Enter'() {
          onRunQuery();
        },
        'Ctrl-Enter'() {
          onRunQuery();
        },
      });
    }
  }, [headerEditor, onRunQuery]);

  /**
   * Handle callback for prettifying
   */
  useEffect(() => {
    if (!headerEditor) {
      return;
    }
    headerEditor.removeKeyMap('Shift-Ctrl-P');

    if (onPrettifyQuery) {
      headerEditor.addKeyMap({
        'Shift-Ctrl-P'() {
          onPrettifyQuery();
        },
      });
    }
  }, [headerEditor, onPrettifyQuery]);

  /**
   * Handle callback for merging
   */
  useEffect(() => {
    if (!headerEditor) {
      return;
    }
    headerEditor.removeKeyMap('Shift-Ctrl-M');

    if (onMergeQuery) {
      headerEditor.addKeyMap({
        'Shift-Ctrl-M'() {
          onMergeQuery();
        },
      });
    }
  }, [headerEditor, onMergeQuery]);

  /**
   * Resizing
   */
  const sizeRef = useRef<number>();
  useEffect(() => {
    if (!ref.current || !headerEditor) {
      return;
    }
    const size = ref.current.clientHeight;
    if (size !== sizeRef.current) {
      headerEditor.setSize(null, null); // TODO: added the args here. double check no effects. might be version issue
    }
    sizeRef.current = size;
  });

  return ref;
}
