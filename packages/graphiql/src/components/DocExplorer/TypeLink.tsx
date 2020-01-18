/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { MouseEvent } from 'react';
import { GraphQLList, GraphQLNonNull, GraphQLType } from 'graphql';

type OnClickFunction = (
  type: GraphQLType,
  event?: MouseEvent<HTMLAnchorElement>,
) => void;

type TypeLinkProps = {
  type: GraphQLType;
  onClick: OnClickFunction;
};

export default class TypeLink extends React.Component<TypeLinkProps, {}> {
  shouldComponentUpdate(nextProps: TypeLinkProps) {
    return this.props.type !== nextProps.type;
  }

  render() {
    return renderType(this.props.type, this.props.onClick);
  }
}

function renderType(type: GraphQLType, onClick: OnClickFunction) {
  if (type instanceof GraphQLNonNull) {
    return (
      <span>
        {renderType(type.ofType, onClick)}
        {'!'}
      </span>
    );
  }
  if (type instanceof GraphQLList) {
    return (
      <span>
        {'['}
        {renderType(type.ofType, onClick)}
        {']'}
      </span>
    );
  }
  return (
    <a
      className="type-name"
      onClick={event => {
        event.preventDefault();
        onClick(type, event);
      }}
      href="#">
      {type.name}
    </a>
  );
}
