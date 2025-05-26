import { FC } from 'react';
import { GraphQLType } from 'graphql';
import { useDocExplorerActions } from '../context';
import { renderType } from './utils';
import './type-link.css';

type TypeLinkProps = {
  /**
   * The type that should be linked to.
   */
  type: GraphQLType;
};

export const TypeLink: FC<TypeLinkProps> = ({ type }) => {
  const { push } = useDocExplorerActions();

  return renderType(type, def => (
    <a
      className="graphiql-doc-explorer-type-name"
      onClick={event => {
        event.preventDefault();
        push({ name: def.name, def });
      }}
      href="#"
    >
      {def.name}
    </a>
  ));
};
