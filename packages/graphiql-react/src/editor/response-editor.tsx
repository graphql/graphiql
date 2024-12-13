import { formatError } from '@graphiql/toolkit';
import type { Position, Token } from 'codemirror';
import { ComponentType, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
   * Customize the tooltip when hovering over properties in the response
   * editor.
   */
  responseTooltip?: ResponseTooltipType;
};

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
    caller: caller || useResponseEditor,
  });
  const { initialResponse, responseEditor, setResponseEditor } =
    useEditorContext({
      nonNull: true,
      caller: caller || useResponseEditor,
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
    void importCodeMirror(
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
    ).then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      // Handle image tooltips and custom tooltips
      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token: Token, _options: any, _cm: CodeMirrorEditor, pos: Position) => {
          const infoElements: JSX.Element[] = [];

          const ResponseTooltipComponent = responseTooltipRef.current;
          if (ResponseTooltipComponent) {
            infoElements.push(
              <ResponseTooltipComponent pos={pos} token={token} />,
            );
          }

          if (ImagePreview.shouldRender(token)) {
            infoElements.push(
              <ImagePreview key="image-preview" token={token} />,
            );
          }

          // We can't refactor to root.unmount() from React 18 because we support React 16/17 too
          if (!infoElements.length) {
            // eslint-disable-next-line react/no-deprecated -- We still support React 16/17
            ReactDOM.unmountComponentAtNode(tooltipDiv);
            return null;
          }
          // eslint-disable-next-line react/no-deprecated -- We still support React 16/17
          ReactDOM.render(infoElements, tooltipDiv);
          return tooltipDiv;
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
    if (validationErrors.length > 0) {
      responseEditor?.setValue(formatError(validationErrors));
    }
  }, [responseEditor, fetchError, validationErrors]);

  return ref;
}
