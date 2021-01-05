/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type {
  IRange as GraphQLRange,
  IPosition as GraphQLPosition,
  Diagnostic,
  CompletionItem as GraphQLCompletionItem,
} from 'graphql-language-service';

import { Position } from 'graphql-language-service';

// @ts-ignore
export type MonacoCompletionItem = monaco.languages.CompletionItem & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};
// @ts-ignore
export function toMonacoRange(range: GraphQLRange): monaco.IRange {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

// @ts-ignore
export function toGraphQLPosition(position: monaco.Position): GraphQLPosition {
  return new Position(position.lineNumber - 1, position.column - 1);
}

export function toCompletion(
  entry: GraphQLCompletionItem,
  range?: GraphQLRange,
  // @ts-ignore
): GraphQLCompletionItem & { range: monaco.IRange } {
  return {
    label: entry.label,
    // TODO: when adding variables to getAutocompleteSuggestions, we appended the $.
    // this appears to cause an issue in monaco, but not vscode
    insertText:
      entry.insertText ||
      (!entry.label.startsWith('$') ? entry.label : entry.label.substring(1)),
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    // @ts-ignore
    range: range ? toMonacoRange(range) : undefined,
    kind: entry.kind,
  };
}

/**
 * Monaco and Vscode have slightly different ideas of marker severity.
 * for example, vscode has Error = 1, whereas monaco has Error = 8. this takes care of that
 * @param severity {DiagnosticSeverity} optional vscode diagnostic severity to convert to monaco MarkerSeverity
 * @returns {monaco.MarkerSeverity} the matching marker severity level on monaco's terms
 */
// export function toMonacoSeverity(severity?: Diagnostic['severity']): monaco.MarkerSeverity {
//   switch (severity) {
//     case 1: {
//       return monaco.MarkerSeverity.Error
//     }
//     case 4: {
//       return monaco.MarkerSeverity.Hint
//     }
//     case 3: {
//       return monaco.MarkerSeverity.Info
//     }
//     case 2: {
//       return monaco.MarkerSeverity.Warning
//     }
//     default: {
//       return monaco.MarkerSeverity.Warning
//     }
//   }
// }

export function toMarkerData(
  diagnostic: Diagnostic,
  // @ts-ignore
): monaco.editor.IMarkerData {
  return {
    startLineNumber: diagnostic.range.start.line + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endColumn: diagnostic.range.end.character,
    message: diagnostic.message,
    severity: 5,
    // severity: toMonacoSeverity(diagnostic.severity),
    code: (diagnostic.code as string) || undefined,
  };
}
