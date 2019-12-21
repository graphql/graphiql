// @flow
import { Position, Range } from 'graphql-language-service-utils';
import { makeExtractTagsFromSource, type GraphQLSource } from './languageUtils';

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
  /(?<=(graphql|gql|graphql\.experimental)`)[\s\S]+?(?=`)/g,
);

// This removes interpolation in JS strings, like ` ${someInterpolationHere}`
const jsRemoveInterpolationRegexp = new RegExp(/([\s]+\${)[\s\S]+?(})/g);

const jsExtractor = makeExtractTagsFromSource(jsGraphQLTagsRegexp);

const reasonFileFilterRegexp = new RegExp(/(\[%(graphql|relay\.))/g);
const reasonGraphQLTagsRegexp = new RegExp(
  /(?<=\[%(graphql|relay\.\w*)[\s\S]*{\|)[.\s\S]+?(?=\|})/gm,
);
const reasonExtractor = makeExtractTagsFromSource(reasonGraphQLTagsRegexp);

const jsLanguages: LanguageConfig = {
  extensions: ['js', 'jsx', 'ts', 'tsx'],
  fileFilter: (content: string) => jsFileFilter.test(content),
  extractSources: (content: string) =>
    jsExtractor(content).map(source => ({
      ...source,
      template: source.template.replace(jsRemoveInterpolationRegexp, ''),
    })),
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
