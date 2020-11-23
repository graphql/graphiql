import { extname } from 'path';
import type { CachedContent } from 'graphql-language-service';
import { Range, Position } from 'graphql-language-service-utils';

import { findGraphQLTags, DEFAULT_TAGS } from './findGraphQLTags';

export const DEFAULT_SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

/**
 * .graphql is the officially reccomended extension for graphql files
 *
 * .gql and .graphqls are included for compatibility for commonly used extensions
 *
 * GQL is a registered trademark of Google, and refers to Google Query Language.
 * GraphQL Foundation does *not* recommend using this extension or acronym for
 * referring to GraphQL.
 */
export const DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS = [
  '.graphql',
  '.graphqls',
  '.gql',
];

/**
 * Helper functions to perform requested services from client/server.
 */

// Check the uri to determine the file type (JavaScript/GraphQL).
// If .js file, either return the parsed query/range or null if GraphQL queries
// are not found.
export function parseDocument(
  text: string,
  uri: string,
  fileExtensions: string[] = DEFAULT_SUPPORTED_EXTENSIONS,
  graphQLFileExtensions: string[] = DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
): CachedContent[] {
  // Check if the text content includes a GraphQLV query.
  // If the text doesn't include GraphQL queries, do not proceed.
  const ext = extname(uri);
  if (fileExtensions.some(e => e === ext)) {
    if (DEFAULT_TAGS.some(t => t === text)) {
      return [];
    }
    const templates = findGraphQLTags(text, ext);
    return templates.map(({ template, range }) => ({ query: template, range }));
  }
  if (graphQLFileExtensions.some(e => e === ext)) {
    const query = text;
    if (!query && query !== '') {
      return [];
    }
    const lines = query.split('\n');
    const range = new Range(
      new Position(0, 0),
      new Position(lines.length - 1, lines[lines.length - 1].length - 1),
    );
    return [{ query, range }];
  }
  return [{ query: text, range: null }];
}
