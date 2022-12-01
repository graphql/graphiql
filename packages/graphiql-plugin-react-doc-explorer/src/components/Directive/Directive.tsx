import type { DirectiveNode } from 'graphql';

// styles
import './Directive.css';

type DirectiveProps = {
  /**
   * The directive that should be rendered.
   */
  directive: DirectiveNode;
};

export function Directive({ directive }: DirectiveProps) {
  return (
    <span className="graphiql-doc-explorer-directive">
      @{directive.name.value}
    </span>
  );
}
