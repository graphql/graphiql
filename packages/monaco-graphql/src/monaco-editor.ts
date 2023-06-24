// Importing monaco-editor imports all languages, that can expand bundle size
// When you import `monaco-editor` under the hood you import
import 'monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

export * from 'monaco-editor/esm/vs/editor/edcore.main';
