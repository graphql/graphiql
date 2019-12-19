// @flow
import { Position, Range } from 'graphql-language-service-utils';
import { getLocator } from './languageUtils';
import { findGraphQLTags } from './findGraphQLTags';

type GraphQLSource = {
  template: string,
  range: Range,
};

/**
 * A helper for extracting GraphQL operations from source via a regexp.
 * It assumes that the only thing the regexp matches is the actual content,
 * so if that's not true for your regexp you probably shouldn't use this
 * directly.
 */
export const makeExtractTagsFromSource = (
  regexp: RegExp,
): ((text: string) => $ReadOnlyArray<GraphQLSource>) => (
  text: string,
): $ReadOnlyArray<GraphQLSource> => {
  const locator = getLocator(text);
  const sources: Array<GraphQLSource> = [];
  let result;
  while ((result = regexp.exec(text)) !== null) {
    if (result) {
      const start = locator(result.index);
      const end = locator(result.index + result[0].length);

      sources.push({
        template: result[0],
        range: new Range(
          new Position(start.line, start.column),
          new Position(end.line, end.column),
        ),
      });
    }
  }

  return [...sources];
};

export type LanguageConfig = {
  +extensions: $ReadOnlyArray<string>,
  +fileFilter: (content: string) => boolean,
  +extractSources: (content: string) => $ReadOnlyArray<GraphQLSource>,
};

/**
 * Filters and other regexps used later on.
 */
const jsFileFilter = new RegExp(/graphql`|graphql\.experimental`|gql`/g);
const jsGraphQLTagsRegexp = new RegExp(
  /(?<=(graphql|gql|graphql\.experimental)`)[.\s\S]+?(?=`)/g,
);

// Unused for now, but potentially something to move to later on
const _jsExtractor = makeExtractTagsFromSource(jsGraphQLTagsRegexp);

const reasonFileFilterRegexp = new RegExp(/(\[%(graphql|relay\.))/g);
const reasonGraphQLTagsRegexp = new RegExp(
  /(?<=\[%(graphql|relay\.\w*)[\s\S]*{\|)[.\s\S]+?(?=\|})/gm,
);
const reasonExtractor = makeExtractTagsFromSource(reasonGraphQLTagsRegexp);

const jsLanguages: LanguageConfig = {
  extensions: ['js', 'jsx', 'ts', 'tsx'],
  fileFilter: (content: string) => jsFileFilter.test(content),
  extractSources: findGraphQLTags,
};

const graphql: LanguageConfig = {
  extensions: ['graphql'],
  fileFilter: () => true,
  extractSources: (content: string) => {
    const lines = content.split('\n');
    const range = new Range(
      new Position(0, 0),
      new Position(lines.length - 1, lines[lines.length - 1].length - 1),
    );
    return [{ template: content, range }];
  },
};

const reasonML: LanguageConfig = {
  extensions: ['re'],
  fileFilter: (content: string) => reasonFileFilterRegexp.test(content),
  extractSources: reasonExtractor,
};

export const languages: $ReadOnlyArray<LanguageConfig> = [
  jsLanguages,
  graphql,
  reasonML,
];

export function makeWatchmanExpressionForLanguages(): $ReadOnlyArray<
  Array<string>,
> {
  return languages.reduce((acc, curr) => {
    curr.extensions.forEach(ext => {
      acc.push(['match', '*.' + ext]);
    });
    return acc;
  }, []);
}

export function getLanguageFromExtension(ext: string): ?LanguageConfig {
  return languages.find(language => language.extensions.find(e => e === ext));
}
