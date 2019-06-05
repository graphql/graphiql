/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { astFromValue, print, GraphQLInputField } from 'graphql';

type DefaultValueProps = {
  field: GraphQLInputField
};

export default function DefaultValue({ field }: DefaultValueProps) {
  const { type, defaultValue } = field;
  if (defaultValue !== undefined) {
    return (
      <span>
        {' = '}
        <span className="arg-default-value">
          {print(astFromValue(defaultValue, type))}
        </span>
      </span>
    );
  }

  return null;
}
