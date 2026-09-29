import { Kind, parse } from 'graphql';
import type { Operation } from '@graphiql/react';

/** The pill shown for a saved item: a single operation's type, or `'mix'`. */
export type DocumentMethod = Operation | 'mix';

/** Cheap regex fallback for when a document can't be parsed. */
function inferOperationType(query: string): Operation {
  const match = /^\s*(query|mutation|subscription)/i.exec(query);
  const keyword = match?.[1]?.toLowerCase();
  if (keyword === 'mutation' || keyword === 'subscription') {
    return keyword;
  }
  return 'query';
}

/**
 * A saved item holds a whole document, which may contain more than one
 * operation. Return the single operation's type, or `'mix'` when there are
 * several so the row shows a neutral pill instead of just the first one's.
 * Anonymous shorthand (`{ ... }`) and unparseable text resolve to `'query'`.
 */
export function getDocumentMethod(query: string): DocumentMethod {
  try {
    const operations = parse(query).definitions.filter(
      def => def.kind === Kind.OPERATION_DEFINITION,
    );
    if (operations.length > 1) {
      return 'mix';
    }
    const [operation] = operations;
    return operation ? operation.operation : 'query';
  } catch {
    return inferOperationType(query);
  }
}
