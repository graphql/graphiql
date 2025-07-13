/**
 * Reexports from Monaco Editor, because while importing them from `'monaco-editor'`
 * it throws an error on SSR: window is not defined
 */
export { KeyCode } from 'monaco-editor/esm/vs/editor/common/standalone/standaloneEnums.js';
export { KeyMod } from 'monaco-editor/esm/vs/editor/common/services/editorBaseApi.js';
export { URI as Uri } from 'monaco-editor/esm/vs/base/common/uri.js'
export { Range } from 'monaco-editor/esm/vs/editor/common/core/range.js'
