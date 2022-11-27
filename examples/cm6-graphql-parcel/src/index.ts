import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { bracketMatching, syntaxHighlighting } from '@codemirror/language';
import { oneDarkHighlightStyle, oneDark } from '@codemirror/theme-one-dark';
// eslint-disable-next-line import/no-unresolved
import { graphql } from 'cm6-graphql';
import query from './sample-query';
import { TestSchema } from './testSchema';

const state = EditorState.create({
  doc: query,
  extensions: [
    bracketMatching(),
    closeBrackets(),
    history(),
    autocompletion(),
    lineNumbers(),
    oneDark,
    syntaxHighlighting(oneDarkHighlightStyle),
    graphql(TestSchema, {
      onShowInDocs(field, type, parentType) {
        alert(
          `Showing in docs.: Field: ${field}, Type: ${type}, ParentType: ${parentType}`,
        );
      },
      onFillAllFields(view, schema, _query, cursor, token) {
        alert(`Filling all fields. Token: ${token}`);
      },
    }),
  ],
});

new EditorView({
  state,
  parent: document.querySelector('#editor')!,
});

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
