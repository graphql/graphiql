import { extname } from 'path';
import { CachedContent } from 'graphql-language-service-types';
import { Range, Position } from 'graphql-language-service-utils';

import { findGraphQLTags, DEFAULT_TAGS } from './findGraphQLTags';

const DEFAULT_SUPPORTED_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx'];

const DEFAULT_SUPPORTED_EXTENSIONS_FORMATTED = DEFAULT_SUPPORTED_EXTENSIONS.map(
  i => `.${i}`,
);

/**
 * Helper functions to perform requested services from client/server.
 */

// Check the uri to determine the file type (JavaScript/GraphQL).
// If .js file, either return the parsed query/range or null if GraphQL queries
// are not found.
export function parseDocument(
  text: string,
  uri: string,
  fileExtensions: string[] = DEFAULT_SUPPORTED_EXTENSIONS_FORMATTED,
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
  } else {
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
}
