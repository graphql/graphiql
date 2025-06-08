import { formatError } from '@graphiql/toolkit';
import { ComponentType, FC, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useGraphiQL } from './provider';
import { ImagePreview } from './image-preview';
import {
  getOrCreateModel,
  createEditor,
  onEditorContainerKeyDown,
  pick,
  cleanupDisposables,
  cn,
} from '../utility';
import { KEY_BINDINGS, RESPONSE_URI } from '../constants';
import { EditorProps } from '../types';
import type { editor as monacoEditor, Position } from '../monaco-editor';
import { Range, languages } from '../monaco-editor';

type ResponseTooltipType = ComponentType<{
  /**
   * A position in the editor.
   */
  position: Position;
  /**
   * Word that has been hovered over.
   */
  word: monacoEditor.IWordAtPosition;
}>;

interface ResponseEditorProps extends EditorProps {
  /**
   * Customize the tooltip when hovering over properties in the response editor.
   */
  responseTooltip?: ResponseTooltipType;
}

export const ResponseEditor: FC<ResponseEditorProps> = ({
  responseTooltip: ResponseTooltip,
  ...props
}) => {
  const {
    fetchError,
    validationErrors,
    initialResponse,
    responseEditor,
    setEditor,
    run,
  } = useGraphiQL(
    pick(
      'fetchError',
      'validationErrors',
      'initialResponse',
      'responseEditor',
      'setEditor',
      'run',
    ),
  );
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
      contextmenu: false, // Disable the right-click context menu
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
      editor.addAction({ ...KEY_BINDINGS.runQuery, run }),
      editor,
      model,
    ];
    return cleanupDisposables(disposables);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <section
      ref={ref}
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      onKeyDown={onEditorContainerKeyDown}
      {...props}
      className={cn('result-window', props.className)}
    />
  );
};
