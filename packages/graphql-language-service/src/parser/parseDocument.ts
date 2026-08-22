import { DocumentNode, ParseOptions, Source, parse } from 'graphql';

type FragmentArgumentParseOptions = ParseOptions & {
  experimentalFragmentArguments?: boolean;
};

/** Parse executable documents with GraphQL.js 17 fragment arguments enabled. */
export function parseDocument(
  source: string | Source,
  options?: ParseOptions,
): DocumentNode {
  return parse(source, {
    ...options,
    experimentalFragmentArguments: true,
  } as FragmentArgumentParseOptions);
}
