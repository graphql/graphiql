import type { FC } from 'react';
import type { DirectiveNode } from 'graphql';
import './directive.css';

type DirectiveProps = {
  /**
   * The directive that should be rendered.
   */
  directive: DirectiveNode;
};

export const Directive: FC<DirectiveProps> = ({ directive }) => {
  return (
    <span className="graphiql-doc-explorer-directive">
      @{directive.name.value}
    </span>
  );
};
