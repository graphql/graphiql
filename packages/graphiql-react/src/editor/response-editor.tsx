import { formatError } from '@graphiql/toolkit';
import { ComponentType, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useSchemaStore, useEditorStore, editorStore } from '../stores';
import { ImagePreview } from './image-preview';
import { getOrCreateModel, createEditor } from '../utility';
import { RESPONSE_URI } from '../constants';
import { clsx } from 'clsx';
import { CommonEditorProps } from './types';
import {
  languages,
  Range,
  editor as monacoEditor,
  Position,
} from '../monaco-editor';

export type ResponseTooltipType = ComponentType<{
  /**
   * A position in the editor.
   */
  position: Position;
  /**
   * Word that has been hovered over.
   */
  word: monacoEditor.IWordAtPosition;
}>;

interface ResponseEditorProps extends CommonEditorProps {
  /**
   * Customize the tooltip when hovering over properties in the response editor.
   */
  responseTooltip?: ResponseTooltipType;
}

export function ResponseEditor({
  responseTooltip: ResponseTooltip,
  ...props
}: ResponseEditorProps) {
  const { fetchError, validationErrors } = useSchemaStore();
  const { initialResponse, responseEditor } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    if (fetchError) {
      responseEditor?.setValue(fetchError);
    }
    if (validationErrors.length) {
      responseEditor?.setValue(formatError(validationErrors));
    }
  }, [responseEditor, fetchError, validationErrors]);

  useEffect(() => {
    const { setEditor } = editorStore.getState();
    const model = getOrCreateModel({
      uri: RESPONSE_URI,
      value: initialResponse,
    });
    // Build the editor
    const editor = createEditor(ref, {
      model,
      readOnly: true,
      lineNumbers: 'off',
      wordWrap: 'on', // Toggle word wrap on resizing editors
    });
    setEditor({ responseEditor: editor });

    let lastRoot: Root | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const provideHover: languages.HoverProvider['provideHover'] = (
      $model,
      position,
    ) => {
      if ($model.uri !== model.uri) {
        return null; // Ignore for other editors
      }
      const wordAtPosition = $model.getWordAtPosition(position);
      if (!wordAtPosition?.word.startsWith('/')) {
        return null;
      }
      if (!ImagePreview.shouldRender(wordAtPosition.word)) {
        return null;
      }

      // Return a placeholder content with a unique ID for now
      const hoverId = `hover-${position.lineNumber}-${position.column}`;
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        const el = document.querySelector<HTMLDivElement>(
          `[data-id="${hoverId}"]`,
        );
        if (!el) {
          return;
        }
        lastRoot?.unmount();
        lastRoot = createRoot(el);
        lastRoot.render(
          // Handle image tooltips and custom tooltips
          <>
            {ResponseTooltip && (
              <ResponseTooltip position={position} word={wordAtPosition} />
            )}
            <ImagePreview path={wordAtPosition.word} />
          </>,
        );
      }, 500);

      return {
        range: new Range(
          position.lineNumber,
          wordAtPosition.startColumn,
          position.lineNumber,
          wordAtPosition.endColumn,
        ),
        contents: [
          {
            value: `<div data-id="${hoverId}">Loading...</div>`,
            supportHtml: true,
          },
        ],
      };
    };
    const disposables = [
      languages.registerHoverProvider(model.getLanguageId(), { provideHover }),
      editor,
      model,
    ];

    // Clean‑up on unmount
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <section
      ref={ref}
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      {...props}
      className={clsx('result-window', props.className)}
    />
  );
}
