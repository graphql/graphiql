import { GraphQLType, isListType, isNonNullType } from 'graphql';

import { useExplorerContext } from '../context';

import './type-link.css';

type TypeLinkProps = {
  type: GraphQLType;
};

export function TypeLink(props: TypeLinkProps) {
  const { push } = useExplorerContext({ nonNull: true, caller: TypeLink });

  if (!props.type) {
    return null;
  }

  const type = props.type;
  if (isNonNullType(type)) {
    return (
      <>
        <TypeLink type={type.ofType} />!
      </>
    );
  }
  if (isListType(type)) {
    return (
      <>
        [<TypeLink type={type.ofType} />]
      </>
    );
  }
  return (
    <a
      className="graphiql-doc-explorer-type-name"
      onClick={event => {
        event.preventDefault();
        push({ name: type.name, def: type });
      }}
      href="#">
      {type.name}
    </a>
  );
}
