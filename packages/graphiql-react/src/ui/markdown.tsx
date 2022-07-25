import { markdown } from '../markdown';

import './markdown.css';

type MarkdownContentProps = {
  children: string;
  onlyShowFirstChild?: boolean;
  type: 'description' | 'deprecation';
};

export function MarkdownContent(props: MarkdownContentProps) {
  return (
    <div
      className={`graphiql-markdown-${props.type}${
        props.onlyShowFirstChild ? ' graphiql-markdown-preview' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: markdown.render(props.children) }}
    />
  );
}
