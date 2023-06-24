/*
 * Importing `monaco-editor` imports all languages, that can expand bundle size
 * When you import `monaco-editor` under the hood you import
 * `monaco-editor/esm/vs/editor/editor.main.js` (that described in his `package.json#module` field)
 * Inside this file there are the following:
 *
 * ```js
 * import '../basic-languages/monaco.contribution'; // ⚠️ a lot of languages, we need only graphql
 * import '../language/css/monaco.contribution'; // ❌ throw out
 * import '../language/html/monaco.contribution'; // ❌ throw out
 * import '../language/json/monaco.contribution'; // ✅ json language for variables/response editor
 * import '../language/typescript/monaco.contribution'; // ❌ throw out
 * export * from './edcore.main'; // ✅ editor, languages, Uri... exports
 * ```
 *
 * Also, types for `monaco-editor/esm/vs/editor/edcore.main` are missed,
 * we enhance them in `monaco.d.ts` 😎
 */
import 'monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

export * from 'monaco-editor/esm/vs/editor/edcore.main';
