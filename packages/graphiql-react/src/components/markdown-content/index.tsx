import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import { markdown } from '../../utility';
import './index.css';

interface MarkdownContentProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  children: string;
  onlyShowFirstChild?: boolean;
  type: 'description' | 'deprecation';
}

export const MarkdownContent = forwardRef<HTMLDivElement, MarkdownContentProps>(
  ({ children, onlyShowFirstChild, type, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={clsx(
        `graphiql-markdown-${type}`,
        onlyShowFirstChild && 'graphiql-markdown-preview',
        props.className,
      )}
      dangerouslySetInnerHTML={{ __html: markdown.render(children) }}
    />
  ),
);
MarkdownContent.displayName = 'MarkdownContent';
