import type { Position, Token } from 'codemirror';
import { ComponentType, useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import { commonKeys, importCodeMirror } from './common';
import { ImagePreview } from './components';
import { EditorContext } from './context';
import { useResizeEditor, useSynchronizeValue } from './hooks';
import { CodeMirrorEditor } from './types';

export type ResponseTooltipType = ComponentType<{ pos: Position }>;

export type UseResponseEditorArgs = {
  ResponseTooltip?: ResponseTooltipType;
  editorTheme?: string;
  value?: string;
};

export function useResponseEditor({
  ResponseTooltip,
  editorTheme = 'graphiql',
  value,
}: UseResponseEditorArgs = {}) {
  const context = useContext(EditorContext);
  const ref = useRef<HTMLDivElement>(null);

  const responseTooltipRef = useRef<ResponseTooltipType | undefined>(
    ResponseTooltip,
  );
  useEffect(() => {
    responseTooltipRef.current = ResponseTooltip;
  }, [ResponseTooltip]);

  if (!context) {
    throw new Error(
      'Tried to call the `useResponseEditor` hook without the necessary context. Make sure that the `EditorContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  const { responseEditor, setResponseEditor } = context;

  const initialValue = useRef(value);

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
        value: initialValue.current || '',
        lineWrapping: true,
        readOnly: true,
        theme: editorTheme,
        mode: 'graphql-results',
        keyMap: 'sublime',
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
  }, [editorTheme, setResponseEditor]);

  useSynchronizeValue(responseEditor, value);

  useResizeEditor(responseEditor, ref);

  return ref;
}
