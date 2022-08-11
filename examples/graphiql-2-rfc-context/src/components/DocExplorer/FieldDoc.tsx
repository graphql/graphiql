/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Argument from './Argument';
import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';
import { GraphQLArgument } from 'graphql';
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
        <div className="doc-category-title">arguments</div>
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
        <div className="doc-category-title">type</div>
        <TypeLink type={field?.type} onClick={onClickType} />
      </div>
      {argsDef}
    </div>
  );
}
