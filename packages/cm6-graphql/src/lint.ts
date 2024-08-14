import { Diagnostic, linter } from '@codemirror/lint';
import { getDiagnostics } from 'graphql-language-service';
import { Position, posToOffset } from './helpers';
import {
  getOpts,
  getSchema,
  optionsStateField,
  schemaStateField,
} from './state';
import { Extension } from '@codemirror/state';
import { validateSchema } from 'graphql';

const SEVERITY = ['error', 'warning', 'info'] as const;

export const lint: Extension = linter(
  view => {
    const schema = getSchema(view.state);
    const options = getOpts(view.state);
    if (!schema) {
      return [];
    }
    const validationErrors = validateSchema(schema);
    if (validationErrors.length) {
      if (!options?.showErrorOnInvalidSchema) {
        return [];
      }

      const combinedError = validationErrors.map(error => {
        return error.message;
      });

      return [
        {
          from: 0,
          to: view.state.doc.length,
          severity: 'error',
          message: combinedError.join('\n'),
          actions: [], // TODO:
        },
      ];
    }
    const results = getDiagnostics(view.state.doc.toString(), schema);

    return results
      .map((item): Diagnostic | null => {
        if (!item.severity || !item.source) {
          return null;
        }

        const calculatedFrom = posToOffset(
          view.state.doc,
          new Position(item.range.start.line, item.range.start.character),
        );
        const from = Math.max(
          0,
          Math.min(calculatedFrom, view.state.doc.length),
        );
        const calculatedRo = posToOffset(
          view.state.doc,
          new Position(item.range.end.line, item.range.end.character - 1),
        );
        const to = Math.min(
          Math.max(from + 1, calculatedRo),
          view.state.doc.length,
        );
        return {
          from,
          to: from === to ? to + 1 : to,
          severity: SEVERITY[item.severity - 1],
          // source: item.source, // TODO:
          message: item.message,
          actions: [], // TODO:
        };
      })
      .filter((_): _ is Diagnostic => Boolean(_));
  },
  {
    needsRefresh(vu) {
      return (
        vu.startState.field(schemaStateField) !==
          vu.state.field(schemaStateField) ||
        vu.startState.field(optionsStateField) !==
          vu.state.field(optionsStateField)
      );
    },
  },
);
