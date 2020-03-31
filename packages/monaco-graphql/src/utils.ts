import * as monaco from 'monaco-editor';
import { Diagnostic } from 'graphql-languageservice';
import {
  Position as PositionType,
  CompletionItem as CompletionItemType,
} from 'vscode-languageserver-types';

export type CompletionItem = CompletionItemType & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};

// online-parser related
export type Position = PositionType & {
  line: number;
  character: number;
  lessThanOrEqualTo?: (position: Position) => boolean;
};

export interface Range {
  start: Position;
  end: Position;
  containsPosition: (position: Position) => boolean;
}

export interface Range {
  start: Position;
  end: Position;
  containsPosition: (position: Position) => boolean;
}

export function toRange(range: Range): monaco.IRange {
  return new monaco.Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

export function toMarkerData(
  diagnostic: Diagnostic,
): monaco.editor.IMarkerData {
  return {
    startLineNumber: diagnostic.range.start.line + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endColumn: diagnostic.range.end.character + 1,
    message: diagnostic.message,
    severity: diagnostic.severity as monaco.MarkerSeverity,
    code: (diagnostic.code as string) || undefined,
  };
}

export function toCompletion(
  entry: CompletionItem,
  range: Range,
): monaco.languages.CompletionItem {
  return {
    label: entry.label,
    insertText: entry.insertText || entry.label,
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: toRange(range),
    kind: entry.kind as monaco.languages.CompletionItemKind,
  };
}

// export function toGraphQLPosition(position: monaco.Position): Position {
//   return {
//     line: position.lineNumber - 1,
//     character: position.column - 1,
//   };
// }

export function fromPosition(position: monaco.Position): Position | void {
  if (!position) {
    return;
  }
  return { character: position.column - 1, line: position.lineNumber - 1 };
}

// export function fromRange(range: monaco.IRange): Range | void {
//   if (!range) {
//     return;
//   }
//   return {
//     start: {
//       line: range.startLineNumber - 1,
//       character: range.startColumn - 1,
//     },
//     end: { line: range.endLineNumber - 1, character: range.endColumn - 1 },
//     containsPosition: pos => {
//       return monaco.Range.containsPosition(range, {
//         lineNumber: pos.line,
//         column: pos.character,
//       });
//     },
//   };
// }
