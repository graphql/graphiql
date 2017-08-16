/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { GraphQLList, GraphQLNonNull } from 'graphql';

export default class TypeLink extends React.Component {
  static propTypes = {
    type: PropTypes.object,
    onClick: PropTypes.func,
  };

  shouldComponentUpdate(nextProps) {
    return this.props.type !== nextProps.type;
  }

  render() {
    return renderType(this.props.type, this.props.onClick);
  }
}

function renderType(type, onClick) {
  if (type instanceof GraphQLNonNull) {
    return <span>{renderType(type.ofType, onClick)}{'!'}</span>;
  }
  if (type instanceof GraphQLList) {
    return <span>{'['}{renderType(type.ofType, onClick)}{']'}</span>;
  }
  return (
    <a className="type-name" onClick={event => onClick(type, event)}>
      {type.name}
    </a>
  );
}
