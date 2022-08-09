/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { useExplorerContext } from '@graphiql/react';
import { GraphQLType, isListType, isNonNullType } from 'graphql';
import React from 'react';

type TypeLinkProps = {
  type: GraphQLType;
};

export default function TypeLink(props: TypeLinkProps) {
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
      className="type-name"
      onClick={event => {
        event.preventDefault();
        push({ name: type.name, def: type });
      }}
      href="#"
    >
      {type.name}
    </a>
  );
}
