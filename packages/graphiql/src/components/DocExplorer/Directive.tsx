/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { GraphQLArgument, DirectiveNode } from 'graphql';
import Argument from './Argument';
import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';
import DefaultValue from './DefaultValue';
import { OnClickTypeFunction } from './types';

type DirectiveProps = {
  directive: DirectiveNode;
  onClickType: OnClickTypeFunction;
};

export default function Directive({ directive, onClickType }: DirectiveProps) {
  let argsDef;
  if (directive && 'arguments' in directive && directive.arguments.length > 0) {
    argsDef = (
      <div className="doc-category">
        <div className="doc-category-title">{'arguments'}</div>
        {directive.arguments.map((arg: GraphQLArgument) => (
          <div key={arg.name} className="doc-category-item">
            <div>
              <Argument arg={arg} onClickType={onClickType} />
            </div>
            <MarkdownContent
              className="doc-value-description"
              markdown={arg.description}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className="arg">
      {'@'}
      <span className="arg-name">{directive.name}</span>
      {argsDef}
    </span>
  );
}
