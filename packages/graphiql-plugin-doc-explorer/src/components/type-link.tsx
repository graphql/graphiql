import { GraphQLType } from 'graphql';

import { useExplorerContext } from '../context';
import { renderType } from './utils';

import './type-link.css';

type TypeLinkProps = {
  /**
   * The type that should be linked to.
   */
  type: GraphQLType;
};

export function TypeLink(props: TypeLinkProps) {
  const { push } = useExplorerContext({ nonNull: true, caller: TypeLink });

  if (!props.type) {
    return null;
  }

  return renderType(props.type, namedType => (
    <a
      className="graphiql-doc-explorer-type-name"
      onClick={event => {
        event.preventDefault();
        push({ name: namedType.name, def: namedType });
      }}
      href="#"
    >
      {namedType.name}
    </a>
  ));
}
