export const SUPPORTED_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx'];
export const SUPPORTED_EXTENSIONS_FORMATTED = SUPPORTED_EXTENSIONS.map(
  i => `.${i}`,
);
export const DEFAULT_STABLE_TAGS = ['graphql', 'gql'];
export const DEFAULT_TAGS = [...DEFAULT_STABLE_TAGS, 'graphql.experimental'];
