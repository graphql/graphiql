import { Diagnostic, linter } from '@codemirror/lint';
import { getDiagnostics } from 'graphql-language-service-interface';
import { Position, posToOffset } from './helpers';
import { getSchema } from './state';

const SEVERITY = ['error', 'warning', 'info'] as const;

export const lint = linter(view => {
  const schema = getSchema(view.state);
  if (!schema) {
    return [];
  }
  const results = getDiagnostics(view.state.doc.toString(), schema);

  return results
    .map((item): Diagnostic | null => {
      if (!item.severity || !item.source) {
        return null;
      }

      return {
        from: posToOffset(
          view.state.doc,
          new Position(item.range.start.line, item.range.start.character),
        ),
        to: posToOffset(
          view.state.doc,
          new Position(item.range.end.line, item.range.end.character - 1),
        ),
        severity: SEVERITY[item.severity - 1],
        // source: item.source, // TODO:
        message: item.message,
        actions: [], // TODO:
      };
    })
    .filter((_): _ is Diagnostic => Boolean(_));
});
