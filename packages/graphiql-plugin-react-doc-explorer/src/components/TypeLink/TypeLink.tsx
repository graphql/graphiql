import { GraphQLType } from 'graphql';

// hooks
import { useDocExplorer } from '../../hooks';

// styles
import './TypeLink.css';

// utils
import { renderType } from '../../utils';

type TypeLinkProps = {
  /**
   * The type that should be linked to.
   */
  type: GraphQLType;
};

export function TypeLink(props: TypeLinkProps) {
  const { push } = useDocExplorer();

  if (!props.type) {
    return null;
  }

  return renderType(props.type, namedType => (
    <button
      className="graphiql-doc-explorer-type-name"
      onClick={event => {
        event.preventDefault();
        push({ name: namedType.name, def: namedType });
      }}
    >
      {namedType.name}
    </button>
  ));
}
