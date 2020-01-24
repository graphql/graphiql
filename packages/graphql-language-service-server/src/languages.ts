import { Position, Range } from 'graphql-language-service-utils';
import { makeExtractTagsFromSource, GraphQLSource } from './languageUtils';

export type LanguageConfig = {
  readonly extensions: ReadonlyArray<string>;
  readonly fileFilter: (content: string) => boolean;
  readonly extractSources: (content: string) => ReadonlyArray<GraphQLSource>;
};

/**
 * Filters and other regexps used later on.
 */
const jsFileFilter = new RegExp(/graphql`|graphql\.experimental`|gql`/);
const jsGraphQLTagsRegexp = new RegExp(
  /(?<=(graphql|gql|graphql\.experimental)`)[\s\S]+?(?=`)/g,
);

// This removes interpolation in JS strings, like ` ${someInterpolationHere}`
const jsRemoveInterpolationRegexp = new RegExp(/([\s]+\${)[\s\S]+?(})/g);

const jsExtractor = makeExtractTagsFromSource(jsGraphQLTagsRegexp);

const reasonFileFilterRegexp = new RegExp(/(\[%(graphql|relay\.))/);
const reasonGraphQLTagsRegexp = new RegExp(
  /(?<=\[%(graphql|relay\.\w*)[\s\S]*{\|)[.\s\S]+?(?=\|})/g,
);
const reasonExtractor = makeExtractTagsFromSource(reasonGraphQLTagsRegexp);

const jsLanguages: LanguageConfig = {
  extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'es6'],
  fileFilter: (content: string) => jsFileFilter.test(content),
  extractSources: (content: string) =>
    jsExtractor(content).map(source => ({
      ...source,
      template: source.template.replace(jsRemoveInterpolationRegexp, ''),
    })),
};

const graphql: LanguageConfig = {
  extensions: ['graphql', 'gql'],
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

const languages: LanguageConfig[] = [jsLanguages, graphql, reasonML];

export function registerLanguage(language: LanguageConfig): void {
  languages.push(language);
}

export function getLanguageFromExtension(ext: string): LanguageConfig | void {
  return languages.find(language => language.extensions.find(e => e === ext));
}
