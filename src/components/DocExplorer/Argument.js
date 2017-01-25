/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import { astFromValue, print } from 'graphql';
import TypeLink from './TypeLink';

export default function Argument({ arg, onClickType, showDefaultValue }) {
  return (
    <span className="arg">
      <span className="arg-name">{arg.name}</span>
      {': '}
      <TypeLink type={arg.type} onClick={onClickType} />
      {arg.defaultValue !== undefined && showDefaultValue !== false &&
        <span>
          {' = '}
          <span className="arg-default-value">
            {print(astFromValue(arg.defaultValue, arg.type))}
          </span>
        </span>
      }
    </span>
  );
}

Argument.propTypes = {
  arg: PropTypes.object.isRequired,
  onClickType: PropTypes.func.isRequired,
  showDefaultValue: PropTypes.bool,
};
