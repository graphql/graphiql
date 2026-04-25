/**
 * Re‑export Monaco Editor exports.
 * Importing directly from 'monaco-editor' causes a “window is not defined” error during SSR.
 */
export { KeyCode } from 'monaco-editor/esm/vs/editor/common/standalone/standaloneEnums.js';
export { KeyMod } from 'monaco-editor/esm/vs/editor/common/services/editorBaseApi.js';
export { URI as Uri } from 'monaco-editor/esm/vs/base/common/uri.js';
export { Range } from 'monaco-editor/esm/vs/editor/common/core/range.js';
