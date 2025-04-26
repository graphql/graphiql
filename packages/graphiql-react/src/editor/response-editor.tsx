import { formatError } from '@graphiql/toolkit';
import type { Position, Token } from 'codemirror';
import { ComponentType, useEffect, useRef, JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { useSchemaContext } from '../schema';

import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { ImagePreview } from './components';
import { useEditorContext } from './context';
import { useSynchronizeOption } from './hooks';
import { CodeMirrorEditor, CommonEditorProps } from './types';

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

export type UseResponseEditorArgs = CommonEditorProps & {
  /**
   * Customize the tooltip when hovering over properties in the response editor.
   */
  responseTooltip?: ResponseTooltipType;
};

// To make react-compiler happy, otherwise complains about using dynamic imports in Component
function importCodeMirrorImports() {
  return importCodeMirror(
    [
      import('codemirror/addon/fold/foldgutter.js'),
      import('codemirror/addon/fold/brace-fold.js'),
      import('codemirror/addon/dialog/dialog.js'),
      import('codemirror/addon/search/search.js'),
      import('codemirror/addon/search/searchcursor.js'),
      import('codemirror/addon/search/jump-to-line.js'),
      // @ts-expect-error
      import('codemirror/keymap/sublime.js'),
      import('codemirror-graphql/esm/results/mode.js'),
      import('codemirror-graphql/esm/utils/info-addon.js'),
    ],
    { useCommonAddons: false },
  );
}

// To make react-compiler happy, otherwise complains about - Hooks may not be referenced as normal values
const _useResponseEditor = useResponseEditor;

export function useResponseEditor(
  {
    responseTooltip,
    editorTheme = DEFAULT_EDITOR_THEME,
    keyMap = DEFAULT_KEY_MAP,
  }: UseResponseEditorArgs = {},
  caller?: Function,
) {
  const { fetchError, validationErrors } = useSchemaContext({
    nonNull: true,
    caller: caller || _useResponseEditor,
  });
  const { initialResponse, responseEditor, setResponseEditor } =
    useEditorContext({
      nonNull: true,
      caller: caller || _useResponseEditor,
    });
  const ref = useRef<HTMLDivElement>(null);

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
      const tooltipRoot = createRoot(document.createElement('div'));
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
          } else {
            tooltipRoot.unmount();
          }
        },
      );

      const container = ref.current;
      if (!container) {
        return;
      }

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

  useSynchronizeOption(responseEditor, 'keyMap', keyMap);

  useEffect(() => {
    if (fetchError) {
      responseEditor?.setValue(fetchError);
    }
    if (validationErrors.length) {
      responseEditor?.setValue(formatError(validationErrors));
    }
  }, [responseEditor, fetchError, validationErrors]);

  return ref;
}
