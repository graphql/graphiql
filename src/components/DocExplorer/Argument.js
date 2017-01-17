/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import TypeLink from './TypeLink';

export default class Argument extends React.Component {
  static propTypes = {
    arg: PropTypes.object.isRequired,
    onClickType: PropTypes.func.isRequired,
  }

  shouldComponentUpdate(nextProps) {
    return this.props.arg !== nextProps.arg ||
      this.props.arg.name !== nextProps.arg.name ||
      this.props.arg.type !== nextProps.arg.type ||
      this.props.arg.defaultValue !== nextProps.arg.defaultValue ||
      this.props.onClickType !== nextProps.onClickType;
  }

  render() {
    const arg = this.props.arg;

    return (
      <span className="arg">
        <span className="arg-name">{arg.name}</span>
        {': '}
        <TypeLink type={arg.type} onClick={this.props.onClickType} />
        {
          arg.defaultValue !== undefined &&
          <span>
            {' = '}
            <span className="arg-default-value">
              { arg.defaultValue === '' ? '""' : arg.defaultValue }
            </span>
          </span>
        }
      </span>
    );
  }
}
