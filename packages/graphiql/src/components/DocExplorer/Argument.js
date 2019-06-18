/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TypeLink from './TypeLink';
import DefaultValue from './DefaultValue';

export default function Argument({ arg, onClickType, showDefaultValue }) {
  return (
    <span className="arg">
      <span className="arg-name">{arg.name}</span>
      {': '}
      <TypeLink type={arg.type} onClick={onClickType} />
      {showDefaultValue !== false && <DefaultValue field={arg} />}
    </span>
  );
}

Argument.propTypes = {
  arg: PropTypes.object.isRequired,
  onClickType: PropTypes.func.isRequired,
  showDefaultValue: PropTypes.bool,
};
