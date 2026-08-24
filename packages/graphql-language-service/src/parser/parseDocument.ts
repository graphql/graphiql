import { DocumentNode, ParseOptions, Source, parse } from 'graphql';

export type GraphQLParseOptions = ParseOptions & {
  experimentalFragmentArguments?: boolean;
};

/** Parse GraphQL documents, including explicitly enabled experimental syntax. */
export function parseDocument(
  source: string | Source,
  options?: GraphQLParseOptions,
): DocumentNode {
  return parse(source, options as ParseOptions);
}
