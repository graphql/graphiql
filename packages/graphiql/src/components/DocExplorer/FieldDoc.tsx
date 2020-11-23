/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Argument from './Argument';
import Directive from './Directive';
import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';
import { GraphQLArgument, DirectiveNode } from 'graphql';
import { OnClickTypeFunction, FieldType } from './types';

type FieldDocProps = {
  field?: FieldType;
  onClickType: OnClickTypeFunction;
};

export default function FieldDoc({ field, onClickType }: FieldDocProps) {
  let argsDef;
  if (field && 'args' in field && field.args.length > 0) {
    argsDef = (
      <div className="doc-category">
        <div className="doc-category-title">{'arguments'}</div>
        {field.args.map((arg: GraphQLArgument) => (
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

  let directivesDef;
  if (
    field &&
    field.astNode &&
    field.astNode.directives &&
    field.astNode.directives.length > 0
  ) {
    directivesDef = (
      <div className="doc-category">
        <div className="doc-category-title">{'directives'}</div>
        {field.astNode.directives.map((directive: DirectiveNode) => (
          <div key={directive.name.value} className="doc-category-item">
            <div>
              <Directive directive={directive} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <MarkdownContent
        className="doc-type-description"
        markdown={field?.description || 'No Description'}
      />
      {field && 'deprecationReason' in field && (
        <MarkdownContent
          className="doc-deprecation"
          markdown={field?.deprecationReason}
        />
      )}
      <div className="doc-category">
        <div className="doc-category-title">{'type'}</div>
        <TypeLink type={field?.type} onClick={onClickType} />
      </div>
      {argsDef}
      {directivesDef}
    </div>
  );
}
