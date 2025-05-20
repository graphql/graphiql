import { formatError } from '@graphiql/toolkit';
import type { Position, Token } from 'codemirror';
import { ComponentType, useEffect, useRef, JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { useSchemaStore, useEditorStore, editorStore } from '../stores';

import { commonKeys } from './common';
import { ImagePreview } from './image-preview';
import { useSynchronizeOption } from './hooks';
import { getOrCreateModel, createEditor } from '../utility';
import { RESPONSE_URI } from '../constants';
import { clsx } from 'clsx';
import { CommonEditorProps } from './types';

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

    const disposables = [editor, model];

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
