import MarkdownIt from 'markdown-it';

export const markdown = new MarkdownIt({
  // we don't want to convert \n to <br> because in markdown a single newline is not a line break
  // https://github.com/graphql/graphiql/issues/3155
  breaks: false,
  linkify: true,
});
