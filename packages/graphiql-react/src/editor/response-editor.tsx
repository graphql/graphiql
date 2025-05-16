import { formatError } from '@graphiql/toolkit';
import type { Position, Token } from 'codemirror';
import { ComponentType, useEffect, useRef, JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { useSchemaStore, useEditorStore, editorStore } from '../stores';

import { commonKeys, DEFAULT_EDITOR_THEME } from './common';
import { ImagePreview } from './image-preview';
import { useSynchronizeOption } from './hooks';
import { CommonEditorProps } from './types';
import { createEditor } from '../create-editor';

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

type ResponseEditorProps = CommonEditorProps & {
  /**
   * Customize the tooltip when hovering over properties in the response editor.
   */
  responseTooltip?: ResponseTooltipType;
};

export function ResponseEditor({
  responseTooltip,
  editorTheme = DEFAULT_EDITOR_THEME,
}: ResponseEditorProps) {
  const { fetchError, validationErrors } = useSchemaStore();
  const { initialResponse } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  /*
  const responseTooltipRef = useRef<ResponseTooltipType | undefined>(
    responseTooltip,
  );
  useEffect(() => {
    responseTooltipRef.current = responseTooltip;
  }, [responseTooltip]);

  useEffect(() => {
    let isActive = true;

    void importCodeMirrorImports().then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

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
        value: initialResponse,
        lineWrapping: true,
        readOnly: true,
        theme: editorTheme,
        mode: 'graphql-results',
        foldGutter: true,
        gutters: ['CodeMirror-foldgutter'],
        // @ts-expect-error
        info: true,
        extraKeys: commonKeys,
      });

      setResponseEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialResponse, setResponseEditor]);

  useEffect(() => {
    if (fetchError) {
      responseEditor?.setValue(fetchError);
    }
    if (validationErrors.length) {
      responseEditor?.setValue(formatError(validationErrors));
    }
  }, [responseEditor, fetchError, validationErrors]);
  */
  useEffect(() => {
    const { setEditor } = editorStore.getState();
    // Build the editor
    const editor = createEditor('response', ref);
    setEditor({ responseEditor: editor });

    const disposables = [editor, editor.getModel()!];

    // Clean‑up on unmount or when deps change
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []);

  return (
    <section
      className="result-window"
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      ref={ref}
    />
  );
}
