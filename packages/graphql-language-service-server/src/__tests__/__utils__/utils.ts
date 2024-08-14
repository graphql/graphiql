import { Range } from 'vscode-languageserver';

export const serializeRange = (range: Range) =>
  JSON.parse(JSON.stringify(range));
