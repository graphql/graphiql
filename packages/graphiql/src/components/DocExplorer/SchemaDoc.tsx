/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TypeLink from './TypeLink';
import MarkdownContent from './MarkdownContent';
import { useSchemaContext } from '@graphiql/react';

// Render the top level Schema
export default function SchemaDoc() {
  const { schema } = useSchemaContext({ nonNull: true });

  if (!schema) {
    return null;
  }

  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType?.();
  const subscriptionType = schema.getSubscriptionType?.();

  return (
    <div>
      <MarkdownContent
        className="doc-type-description"
        markdown={
          schema.description ||
          'A GraphQL schema provides a root type for each kind of operation.'
        }
      />
      <div className="doc-category">
        <div className="doc-category-title">root types</div>
        {queryType ? (
          <div className="doc-category-item">
            <span className="keyword">query</span>
            {': '}
            <TypeLink type={queryType} />
          </div>
        ) : null}
        {mutationType && (
          <div className="doc-category-item">
            <span className="keyword">mutation</span>
            {': '}
            <TypeLink type={mutationType} />
          </div>
        )}
        {subscriptionType && (
          <div className="doc-category-item">
            <span className="keyword">subscription</span>
            {': '}
            <TypeLink type={subscriptionType} />
          </div>
        )}
      </div>
    </div>
  );
}
