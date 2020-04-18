/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as monaco from 'monaco-editor';
import {
  Range as GraphQLRange,
  Position as GraphQLPosition,
} from 'graphql-language-service-types';

export interface ICreateData {
  languageId: string;
  enableSchemaRequest: boolean;
  schemaUrl: String;
}
import {
  Diagnostic,
  CompletionItem as GraphQLCompletionItem,
} from 'graphql-languageservice';

export type MonacoCompletionItem = monaco.languages.CompletionItem & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};

export function toMonacoRange(range: GraphQLRange): monaco.IRange {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

export function toGraphQLPosition(position: monaco.Position): GraphQLPosition {
  return { line: position.lineNumber - 1, character: position.column - 1 };
}

export function toCompletion(
  entry: GraphQLCompletionItem,
  range: GraphQLRange,
): GraphQLCompletionItem & { range: monaco.IRange } {
  return {
    label: entry.label,
    insertText: entry.insertText || (entry.label as string),
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: toMonacoRange(range),
    kind: entry.kind,
  };
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
    severity: 5 || (diagnostic.severity as monaco.MarkerSeverity),
    code: (diagnostic.code as string) || undefined,
  };
}
