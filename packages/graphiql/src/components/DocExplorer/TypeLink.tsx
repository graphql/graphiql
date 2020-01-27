/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { GraphQLList, GraphQLNonNull, GraphQLType } from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { OnClickTypeFunction } from './types';

type TypeLinkProps = {
  type?: Maybe<GraphQLType>;
  onClick: OnClickTypeFunction;
};

export default class TypeLink extends React.Component<TypeLinkProps> {
  shouldComponentUpdate(nextProps: TypeLinkProps) {
    return this.props.type !== nextProps.type;
  }

  render() {
    return renderType(this.props.type, this.props.onClick);
  }
}

function renderType(type: Maybe<GraphQLType>, onClick: OnClickTypeFunction) {
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
      {type?.name}
    </a>
  );
}
