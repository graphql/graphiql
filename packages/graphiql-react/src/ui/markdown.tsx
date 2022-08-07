import { forwardRef } from 'react';
import { markdown } from '../markdown';
import { compose } from '../utility/compose';

import './markdown.css';

type MarkdownContentProps = {
  children: string;
  onlyShowFirstChild?: boolean;
  type: 'description' | 'deprecation';
};

export const MarkdownContent = forwardRef<
  HTMLDivElement,
  MarkdownContentProps & Omit<JSX.IntrinsicElements['div'], 'children'>
>(({ children, onlyShowFirstChild, type, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={compose(
      `graphiql-markdown-${type}`,
      onlyShowFirstChild ? ' graphiql-markdown-preview' : '',
      props.className,
    )}
    dangerouslySetInnerHTML={{ __html: markdown.render(children) }}
  />
));
MarkdownContent.displayName = 'MarkdownContent';
