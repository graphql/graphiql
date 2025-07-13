import { formatError } from '@graphiql/toolkit';
import { ComponentType, FC, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useGraphiQL, useGraphiQLActions } from './provider';
import { ImagePreview } from './image-preview';
import {
  getOrCreateModel,
  createEditor,
  onEditorContainerKeyDown,
  pick,
  cleanupDisposables,
  cn,
  Range
} from '../utility';
import { KEY_BINDINGS, URI_NAME } from '../constants';
import type { EditorProps } from '../types';
import type * as monaco from 'monaco-editor';
import { useMonaco } from '../stores';

type ResponseTooltipType = ComponentType<{
  /**
   * A position in the editor.
   */
  position: monaco.Position;
  /**
   * Word that has been hovered over.
   */
  word: monaco.editor.IWordAtPosition;
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
  const { setEditor, run } = useGraphiQLActions();
  const { fetchError, validationErrors, responseEditor, uriInstanceId } =
    useGraphiQL(
      pick('fetchError', 'validationErrors', 'responseEditor', 'uriInstanceId'),
    );
  const ref = useRef<HTMLDivElement>(null!);
  const { monaco } = useMonaco();
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
      uri: `${uriInstanceId}${URI_NAME.response}`,
      value: '',
    });
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

    const provideHover: monaco.languages.HoverProvider['provideHover'] = (
      $model,
      position,
    ) => {
      const sameModel = $model.uri === model.uri;
      if (!sameModel) {
        return null; // Ignore for other editors
      }
      const wordAtPosition = $model.getWordAtPosition(position);
      if (!wordAtPosition?.word.startsWith('/')) {
        return null;
      }
      const shouldRender = ImagePreview.shouldRender(wordAtPosition.word);
      if (!shouldRender) {
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
    const languageId = model.getLanguageId();
    const disposables = [
      monaco.languages.registerHoverProvider(languageId, { provideHover }),
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
