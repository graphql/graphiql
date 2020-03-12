/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { Component, FunctionComponent, useEffect } from 'react';
import * as CM from 'codemirror';
import ReactDOM from 'react-dom';
import commonKeys from '../utility/commonKeys';
import { ImagePreview as ImagePreviewComponent } from './ImagePreview';
import { useSessionContext } from '../state/GraphiQLSessionProvider';

type ResultViewerProps = {
  editorTheme?: string;
  ResultsTooltip?: typeof Component | FunctionComponent;
  ImagePreview: typeof ImagePreviewComponent;
};

export function ResultViewer(props: ResultViewerProps) {
  const divRef = React.useRef<HTMLElement | null>(null);
  const viewerRef = React.useRef<CM.Editor & { options: any }>();
  const session = useSessionContext();
  useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror');
    require('codemirror/addon/fold/foldgutter');
    require('codemirror/addon/fold/brace-fold');
    require('codemirror/addon/dialog/dialog');
    require('codemirror/addon/search/search');
    require('codemirror/addon/search/searchcursor');
    require('codemirror/addon/search/jump-to-line');
    require('codemirror/keymap/sublime');
    require('codemirror-graphql/results/mode');
    const Tooltip = props.ResultsTooltip;
    const ImagePreview = props.ImagePreview;

    if (Tooltip || ImagePreview) {
      require('codemirror-graphql/utils/info-addon');
      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token: any, _options: any, _cm: CodeMirror.Editor, pos: any) => {
          const infoElements: JSX.Element[] = [];
          if (Tooltip) {
            infoElements.push(<Tooltip pos={pos} />);
          }

          if (
            ImagePreview &&
            typeof ImagePreview.shouldRender === 'function' &&
            ImagePreview.shouldRender(token)
          ) {
            infoElements.push(<ImagePreview token={token} />);
          }

          if (!infoElements.length) {
            ReactDOM.unmountComponentAtNode(tooltipDiv);
            return null;
          }
          ReactDOM.render(<div>{infoElements}</div>, tooltipDiv);
          return tooltipDiv;
        },
      );
    }

    viewerRef.current = CodeMirror(divRef.current, {
      lineWrapping: true,
      value: session.results?.formattedText ?? '',
      readOnly: true,
      theme: props.editorTheme || 'graphiql',
      mode: 'graphql-results',
      keyMap: 'sublime',
      foldGutter: {
        minFoldSize: 4,
      },
      gutters: ['CodeMirror-foldgutter'],
      info: Boolean(props.ResultsTooltip || props.ImagePreview),
      extraKeys: commonKeys,
    });
  }, []);

  useEffect(() => {
    if (session.results && viewerRef.current) {
      viewerRef.current.setValue(session.results.formattedText || '');
    }
  }, [session.results.text]);

  return (
    <section
      className="result-window"
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      ref={divRef}
    />
  );
}
