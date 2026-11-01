import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror6';
import { StreamLanguage } from '@codemirror/language';
import { graphql } from 'codemirror-graphql/cm6-legacy/mode';
import query from './sample-query';

const state = EditorState.create({
  doc: query,
  extensions: [basicSetup, StreamLanguage.define(graphql)],
});

new EditorView({
  state,
  parent: document.querySelector('#editor')!,
});

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
