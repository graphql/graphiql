import React from 'react';

import type { GraphQLSchema } from 'graphql';

import { MarkdownContent } from '../../ui';
import { ExplorerSection } from './section';
import { TypeLink } from './type-link';

import './schema-documentation.css';

type SchemaDocumentationProps = {
  /**
   * The schema that should be rendered.
   */
  schema: GraphQLSchema;
};

export function SchemaDocumentation(props: SchemaDocumentationProps) {
  const queryType = props.schema.getQueryType();
  const mutationType = props.schema.getMutationType?.();
  const subscriptionType = props.schema.getSubscriptionType?.();

  return (
    <>
      <MarkdownContent type="description">
        {props.schema.description ||
          'A GraphQL schema provides a root type for each kind of operation.'}
      </MarkdownContent>
      <ExplorerSection title="Root Types">
        {queryType ? (
          <div>
            <span className="graphiql-doc-explorer-root-type">query</span>
            {': '}
            <TypeLink type={queryType} />
          </div>
        ) : null}
        {mutationType && (
          <div>
            <span className="graphiql-doc-explorer-root-type">mutation</span>
            {': '}
            <TypeLink type={mutationType} />
          </div>
        )}
        {subscriptionType && (
          <div>
            <span className="graphiql-doc-explorer-root-type">
              subscription
            </span>
            {': '}
            <TypeLink type={subscriptionType} />
          </div>
        )}
      </ExplorerSection>
    </>
  );
}
