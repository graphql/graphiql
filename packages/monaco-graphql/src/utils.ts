/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { SchemaConfig } from './typings';
import type {
  IRange as GraphQLRange,
  IPosition as GraphQLPosition,
  Diagnostic,
  CompletionItem as GraphQLCompletionItem,
} from 'graphql-language-service';

import { buildASTSchema, printSchema } from 'graphql';

import { Position } from 'graphql-language-service';

// for backwards compatibility
export const getModelLanguageId = (model: monaco.editor.ITextModel) => {
  if ('getModeId' in model) {
    // for <0.30.0 support
    // @ts-expect-error
    return model.getModeId();
  }
  return model.getLanguageId();
};

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
  return new Position(position.lineNumber - 1, position.column - 1);
}

export type GraphQLWorkerCompletionItem = GraphQLCompletionItem & {
  range?: monaco.IRange;
  command?: monaco.languages.CompletionItem['command'];
};

export function toCompletion(
  entry: GraphQLCompletionItem,
  range?: GraphQLRange,
): GraphQLWorkerCompletionItem {
  const results: GraphQLWorkerCompletionItem = {
    label: entry.label,
    insertText: entry.insertText,
    insertTextFormat: entry.insertTextFormat,
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: range ? toMonacoRange(range) : undefined,
    kind: entry.kind,
  };
  if (entry.insertTextFormat) {
    results.insertTextFormat = entry.insertTextFormat;
  }

  if (entry.command) {
    results.command = { ...entry.command, id: entry.command.command };
  }

  return results;
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

/**
 * Send the most minimal string representation
 * to the worker for language service instantiation
 */
export const getStringSchema = (schemaConfig: SchemaConfig) => {
  const {
    schema: graphQLSchema,
    documentAST,
    introspectionJSON,
    introspectionJSONString,
    documentString,
    ...rest
  } = schemaConfig;
  if (graphQLSchema) {
    return {
      ...rest,
      documentString: printSchema(graphQLSchema),
    };
  }
  if (introspectionJSONString) {
    return {
      ...rest,
      introspectionJSONString,
    };
  }
  if (documentString) {
    return {
      ...rest,
      documentString,
    };
  }
  if (introspectionJSON) {
    return {
      ...rest,
      introspectionJSONString: JSON.stringify(introspectionJSON),
    };
  }

  if (documentAST) {
    const schema = buildASTSchema(documentAST, rest.buildSchemaOptions);
    return {
      ...rest,
      documentString: printSchema(schema),
    };
  }
  throw new Error('no schema supplied');
};
