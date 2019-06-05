/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { GraphQLList, GraphQLNonNull, GraphQLType } from 'graphql';

type TypeLinkProps = {
  type?: GraphQLType,
  onClick?: (type: GraphQLType, e: React.MouseEvent<any>) => any,
};

export default class TypeLink extends React.Component<TypeLinkProps, {}> {
  shouldComponentUpdate(nextProps: TypeLinkProps) {
    return this.props.type !== nextProps.type;
  }

  render() {
    return renderType(this.props.type, this.props.onClick);
  }
}

function renderType(
  type: GraphQLType,
  onClick: (type: GraphQLType, e: React.MouseEvent<any>) => any,
) {
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
      onClick={(event: React.MouseEvent<any>) => onClick(type, event)}>
      {type.name}
    </a>
  );
}
