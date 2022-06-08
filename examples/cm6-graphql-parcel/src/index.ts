import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { StreamLanguage } from '@codemirror/language';
import { graphql } from 'codemirror-graphql/cm6-legacy/mode';
import query from './sample-query';

const state = EditorState.create({
  doc: query,
  extensions: [basicSetup, StreamLanguage.define(graphql)],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const view = new EditorView({
  state,
  parent: document.querySelector('#editor')!,
});

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
