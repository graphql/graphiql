/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { astFromValue, print, GraphQLArgument, ValueNode } from 'graphql';

const printDefault = (ast?: ValueNode | null): string => {
  if (!ast) {
    return '';
  }
  return print(ast);
};

export default function DefaultValue({ field }: { field: GraphQLArgument }) {
  const { type, defaultValue } = field;
  if (defaultValue !== undefined) {
    return (
      <span>
        {' = '}
        <span className="arg-default-value">
          {printDefault(astFromValue(defaultValue, type))}
        </span>
      </span>
    );
  }

  return null;
}
