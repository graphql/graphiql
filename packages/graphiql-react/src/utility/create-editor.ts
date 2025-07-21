import type { KeyboardEventHandler, RefObject } from 'react';
import type * as monaco from 'monaco-editor';
import type { MonacoEditor } from '../types';
import { monacoStore } from '../stores';
import { Uri } from '../utility';

export const onEditorContainerKeyDown: KeyboardEventHandler<
  HTMLDivElement
> = event => {
  const el = event.currentTarget;
  const isFocused = el === document.activeElement;
  if (isFocused && event.code === 'Enter') {
    event.preventDefault();
    el.querySelector('textarea')?.focus();
  }
};

export function getOrCreateModel({
  uri: $uri,
  value,
}: {
  uri: string;
  value: string;
}) {
  const { monaco } = monacoStore.getState();
  if (!monaco) {
    throw new Error('Monaco editor is not initialized');
  }
  const uri = Uri.file($uri);
  const model = monaco.editor.getModel(uri);
  const language = uri.path.split('.').at(-1)!;
  return model ?? monaco.editor.createModel(value, language, uri);
}

export function createEditor(
  domElement: RefObject<HTMLDivElement>,
  options: monaco.editor.IStandaloneEditorConstructionOptions,
): MonacoEditor {
  const { model } = options;
  if (!model) {
    throw new Error('options.model is required');
  }
  const language = model.uri.path.split('.').at(-1)!;
  const { monaco } = monacoStore.getState();
  if (!monaco) {
    throw new Error('Monaco editor is not initialized');
  }
  return monaco.editor.create(domElement.current, {
    language,
    automaticLayout: true,
    fontSize: 15,
    minimap: { enabled: false }, // disable the minimap
    tabSize: 2,
    renderLineHighlight: 'none', // Remove a line selection border
    stickyScroll: { enabled: false }, // Disable sticky scroll widget
    overviewRulerLanes: 0, // remove unnecessary error highlight on the scroll
    scrollbar: {
      verticalScrollbarSize: 10,
    },
    scrollBeyondLastLine: false, // cleans up unnecessary "padding-bottom" on each editor
    fontFamily: '"Fira Code"',
    // Enable font ligatures and fix incorrect caret position on Windows
    // See: https://github.com/graphql/graphiql/issues/4040
    fontLigatures: true,
    lineNumbersMinChars: 2, // reduce line numbers width on the left size
    tabIndex: -1, // Do not allow tabbing into the editor, only via by pressing Enter or its container
    ...options,
  });
}
