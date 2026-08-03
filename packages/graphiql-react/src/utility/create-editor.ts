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
    // Disable Fira Code's ligatures without regressing the Windows caret fix.
    // This is deliberately an explicit `font-feature-settings` string, not
    // `false`: Monaco only takes its monospace caret-measurement fast path when
    // this exactly equals its OFF constant (`"liga" off, "calt" off`), and that
    // fast path mis-positions the caret with Fira Code on Windows (#4040). Any
    // other string keeps ligatures off while forcing per-character width
    // measurement, so the caret stays correct. See PR #4430 for the full write-up.
    fontLigatures: '"liga" off, "calt" off, "clig" off',
    lineNumbersMinChars: 2, // reduce line numbers width on the left size
    roundedSelection: false, // prevent multiline text selection from highlighting +1 characters after beginning/end of selection
    tabIndex: -1, // Do not allow tabbing into the editor, only via by pressing Enter or its container
    ...options,
  });
}
