import { DirectiveNode } from 'graphql';

import './directive.css';

type DirectiveProps = {
  directive: DirectiveNode;
};

export function Directive({ directive }: DirectiveProps) {
  return (
    <span className="graphiql-doc-explorer-directive">
      @{directive.name.value}
    </span>
  );
}
