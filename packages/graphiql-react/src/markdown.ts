import MarkdownIt from 'markdown-it';

export const markdown = new MarkdownIt({
  breaks: true,
  linkify: true,
});
