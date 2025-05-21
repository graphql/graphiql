import { formatError } from '@graphiql/toolkit';
import type { Position, Token } from 'codemirror';
import { ComponentType, useEffect, useRef, JSX } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useSchemaStore, useEditorStore, editorStore } from '../stores';

import { commonKeys } from './common';
import { ImagePreview } from './image-preview';
import { getOrCreateModel, createEditor } from '../utility';
import { RESPONSE_URI } from '../constants';
import { clsx } from 'clsx';
import { CommonEditorProps } from './types';
import { languages, Range } from '../monaco-editor';

export type ResponseTooltipType = ComponentType<{
  /**
   * The position of the token in the editor contents.
   */
  pos: Position;
  /**
   * The token that has been hovered over.
   */
  token: Token;
}>;

interface ResponseEditorProps extends CommonEditorProps {
  /**
   * Customize the tooltip when hovering over properties in the response editor.
   */
  responseTooltip?: ResponseTooltipType;
}

export function ResponseEditor({
  responseTooltip,
  ...props
}: ResponseEditorProps) {
  const { fetchError, validationErrors } = useSchemaStore();
  const { initialResponse, responseEditor } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  /*
  const responseTooltipRef = useRef<ResponseTooltipType | undefined>(
    responseTooltip,
  );
  useEffect(() => {
    responseTooltipRef.current = responseTooltip;
  }, [responseTooltip]);

  useEffect(() => {
    void importCodeMirrorImports().then(CodeMirror => {
      // Handle image tooltips and custom tooltips
      const tooltipContainer = document.createElement('div');
      const tooltipRoot = createRoot(tooltipContainer);
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token: Token, _options: any, _cm: CodeMirrorEditor, pos: Position) => {
          const ResponseTooltip = responseTooltipRef.current;
          const infoElements: JSX.Element[] = [
            ResponseTooltip && <ResponseTooltip pos={pos} token={token} />,
            ImagePreview.shouldRender(token) && (
              <ImagePreview key="image-preview" token={token} />
            ),
          ].filter((v): v is JSX.Element => Boolean(v));

          if (infoElements.length) {
            tooltipRoot.render(infoElements);
            return tooltipContainer;
          }
          tooltipRoot.unmount();
        },
      );

      const container = ref.current;
      const newEditor = CodeMirror(container, {
        lineWrapping: true,
        info: true,
        extraKeys: commonKeys,
      });
    });
  }, []);
  */
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
    // Build the editor
    const model = getOrCreateModel({
      uri: RESPONSE_URI,
      value: initialResponse,
    });
    const editor = createEditor(ref, {
      model,
      readOnly: true,
      lineNumbers: 'off',
    });
    setEditor({ responseEditor: editor });

    let lastRoot: Root | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    function renderReactTooltip(containerId: string, path: string) {
      const el = document.querySelector<HTMLDivElement>(
        `[data-id="${containerId}"]`,
      );
      if (!el) {
        return;
      }
      lastRoot?.unmount();
      lastRoot = createRoot(el);
      lastRoot.render(<ImagePreview path={path} />);
    }

    const disposables = [
      languages.registerHoverProvider('json', {
        provideHover($model, position) {
          if ($model.uri !== model.uri) {
            return null; // Ignore for other editors
          }
          const word = $model.getWordAtPosition(position);
          if (!word?.word.startsWith('/')) {
            return null;
          }
          if (!ImagePreview.shouldRender(word.word)) {
            return null;
          }

          // Return a placeholder content with a unique ID for now
          const hoverId = `hover-${position.lineNumber}-${position.column}`;
          if (timerId) {
            clearTimeout(timerId);
          }
          timerId = setTimeout(() => {
            renderReactTooltip(hoverId, word?.word); // render the React component after DOM is ready
          }, 500);

          return {
            range: new Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              {
                value: `<div data-id="${hoverId}">Loading...</div>`,
                supportHtml: true,
              },
            ],
          };
        },
      }),
      editor,
      model,
    ];

    // Clean‑up on unmount or when deps change
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
