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
import { CodeMirrorEditor, KeyMap } from './types';

export type ResponseTooltipType = ComponentType<{ pos: Position }>;

export type UseResponseEditorArgs = {
  ResponseTooltip?: ResponseTooltipType;
  editorTheme?: string;
  keyMap?: KeyMap;
};

export function useResponseEditor({
  ResponseTooltip,
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
}: UseResponseEditorArgs = {}) {
  const { fetchError, validationErrors } = useSchemaContext({
    nonNull: true,
    caller: useResponseEditor,
  });
  const { initialResponse, responseEditor, setResponseEditor } =
    useEditorContext({
      nonNull: true,
      caller: useResponseEditor,
    });
  const ref = useRef<HTMLDivElement>(null);

  const responseTooltipRef = useRef<ResponseTooltipType | undefined>(
    ResponseTooltip,
  );
  useEffect(() => {
    responseTooltipRef.current = ResponseTooltip;
  }, [ResponseTooltip]);

  useEffect(() => {
    let isActive = true;
    importCodeMirror(
      [
        import('codemirror/addon/fold/foldgutter'),
        import('codemirror/addon/fold/brace-fold'),
        import('codemirror/addon/dialog/dialog'),
        import('codemirror/addon/search/search'),
        import('codemirror/addon/search/searchcursor'),
        import('codemirror/addon/search/jump-to-line'),
        // @ts-expect-error
        import('codemirror/keymap/sublime'),
        import('codemirror-graphql/esm/results/mode'),
        import('codemirror-graphql/esm/utils/info-addon'),
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
            infoElements.push(<ResponseTooltipComponent pos={pos} />);
          }

          if (ImagePreview.shouldRender(token)) {
            infoElements.push(
              <ImagePreview key="image-preview" token={token} />,
            );
          }

          if (!infoElements.length) {
            ReactDOM.unmountComponentAtNode(tooltipDiv);
            return null;
          }
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
