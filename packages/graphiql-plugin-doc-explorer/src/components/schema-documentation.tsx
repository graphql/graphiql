import type { FC } from 'react';
import type { GraphQLSchema } from 'graphql';
import { MarkdownContent } from '@graphiql/react';
import { ExplorerSection } from './section';
import { TypeLink } from './type-link';
import { VirtualList } from './virtual-list';
import './schema-documentation.css';

type SchemaDocumentationProps = {
  /**
   * The schema that should be rendered.
   */
  schema: GraphQLSchema;
};

const UNVIRTUALIZED_MAX_LENGTH = 1000;

export const SchemaDocumentation: FC<SchemaDocumentationProps> = ({
  schema,
}) => {
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();
  const subscriptionType = schema.getSubscriptionType();
  const typeMap = schema.getTypeMap();
  const ignoreTypesInAllSchema = [
    queryType?.name,
    mutationType?.name,
    subscriptionType?.name,
  ];
  const allTypes = Object.values(typeMap).filter(
    type =>
      !ignoreTypesInAllSchema.includes(type.name) &&
      !type.name.startsWith('__'),
  );

  return (
    <>
      <MarkdownContent type="description">
        {schema.description ||
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
      <ExplorerSection title="All Schema Types">
        {allTypes.length > UNVIRTUALIZED_MAX_LENGTH ? (
          <VirtualList
            items={allTypes}
            estimateSize={() => 23}
            renderItem={type => <TypeLink type={type} />}
          />
        ) : (
          <div>
            {allTypes.map(type => (
              <div key={type.name}>
                <TypeLink type={type} />
              </div>
            ))}
          </div>
        )}
      </ExplorerSection>
    </>
  );
};
