const removeQueryName = query =>
  query.replace(
    /^[^{(]+([{(])/,
    (_match, openingCurlyBracketsOrParenthesis) =>
      `query ${openingCurlyBracketsOrParenthesis}`,
  );

const getQuery = (arg, spaceCount) => {
  const { operationDataList } = arg;
  const { query } = operationDataList[0];
  const anonymousQuery = removeQueryName(query);
  return (
    ' '.repeat(spaceCount) +
    anonymousQuery.replaceAll('\n', '\n' + ' '.repeat(spaceCount))
  );
};

const exampleSnippetOne = {
  name: 'Example One',
  language: 'JavaScript',
  codeMirrorMode: 'jsx',
  options: [],
  generate: arg => `export const query = graphql\`
  ${getQuery(arg, 2)}
  \`
  `,
};

const exampleSnippetTwo = {
  name: 'Example Two',
  language: 'JavaScript',
  codeMirrorMode: 'jsx',
  options: [],
  generate: arg => `import { graphql } from 'graphql'
  export const query = graphql\`
  ${getQuery(arg, 2)}
  \`
  `,
};

export const snippets = [exampleSnippetOne, exampleSnippetTwo];
