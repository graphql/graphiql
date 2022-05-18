import type { Position, Token } from 'codemirror';
import { ComponentType, useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import { commonKeys, importCodeMirror } from './common';
import { ImagePreview } from './components';
import { EditorContext } from './context';
import { useResizeEditor, useSynchronizeValue } from './hooks';
import { CodeMirrorEditor } from './types';

export type ResultsTooltipType = ComponentType<{ pos: Position }>;

export type UseResultEditorArgs = {
  ResultsTooltip?: ResultsTooltipType;
  editorTheme?: string;
  value?: string;
};

export function useResultEditor({
  ResultsTooltip,
  editorTheme = 'graphiql',
  value,
}: UseResultEditorArgs = {}) {
  const context = useContext(EditorContext);
  const ref = useRef<HTMLDivElement>(null);

  const resultsTooltipRef = useRef<ResultsTooltipType | undefined>(
    ResultsTooltip,
  );
  useEffect(() => {
    resultsTooltipRef.current = ResultsTooltip;
  }, [ResultsTooltip]);

  if (!context) {
    throw new Error(
      'Tried to call the `useResultEditor` hook without the necessary context. Make sure that the `EditorContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  const { resultEditor, setResultEditor } = context;

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

          const ResultsTooltipComponent = resultsTooltipRef.current;
          if (ResultsTooltipComponent) {
            infoElements.push(<ResultsTooltipComponent pos={pos} />);
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

      setResultEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, setResultEditor]);

  useSynchronizeValue(resultEditor, value);

  useResizeEditor(resultEditor, ref);

  return ref;
}
