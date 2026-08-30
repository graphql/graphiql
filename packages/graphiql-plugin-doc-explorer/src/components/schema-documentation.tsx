import type { FC } from 'react';
import type { GraphQLNamedType, GraphQLSchema } from 'graphql';
import {
  isObjectType,
  isInterfaceType,
  isInputObjectType,
  isEnumType,
  isScalarType,
  isUnionType,
} from 'graphql';
import { MethodPill } from '@graphiql/react';
import { useDocExplorerActions } from '../context';
import './schema-documentation.css';

type SchemaDocumentationProps = {
  /**
   * The schema that should be rendered.
   */
  schema: GraphQLSchema;
};

function getTypeKindLabel(type: GraphQLNamedType): string {
  if (isObjectType(type)) {
    return 'TYPE';
  }
  if (isInterfaceType(type)) {
    return 'INTERFACE';
  }
  if (isInputObjectType(type)) {
    return 'INPUT';
  }
  if (isEnumType(type)) {
    return 'ENUM';
  }
  if (isScalarType(type)) {
    return 'SCALAR';
  }
  if (isUnionType(type)) {
    return 'UNION';
  }
  return 'TYPE';
}

export const SchemaDocumentation: FC<SchemaDocumentationProps> = ({
  schema,
}) => {
  const { push } = useDocExplorerActions();
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();
  const subscriptionType = schema.getSubscriptionType();
  const rootTypeNames = new Set(
    [queryType?.name, mutationType?.name, subscriptionType?.name].filter(
      Boolean,
    ),
  );

  const allTypes = Object.values(schema.getTypeMap()).filter(
    type => !type.name.startsWith('__') && !rootTypeNames.has(type.name),
  );

  return (
    <div className="graphiql-doc-explorer-schema-overview">
      {/* Root types section */}
      <div className="graphiql-doc-explorer-schema-section-header">
        ROOT TYPES
      </div>
      <div className="graphiql-doc-explorer-schema-root-types">
        {queryType && (
          <button
            type="button"
            className="graphiql-doc-explorer-schema-root-row"
            onClick={() => push({ name: queryType.name, def: queryType })}
          >
            <MethodPill operation="query" aria-hidden />
            <span className="graphiql-doc-explorer-schema-root-label">
              Query
            </span>
            <span className="graphiql-doc-explorer-schema-root-colon">:</span>
            <span className="graphiql-doc-explorer-type-name">
              {queryType.name}
            </span>
          </button>
        )}
        {mutationType && (
          <button
            type="button"
            className="graphiql-doc-explorer-schema-root-row"
            onClick={() => push({ name: mutationType.name, def: mutationType })}
          >
            <MethodPill operation="mutation" aria-hidden />
            <span className="graphiql-doc-explorer-schema-root-label">
              Mutation
            </span>
            <span className="graphiql-doc-explorer-schema-root-colon">:</span>
            <span className="graphiql-doc-explorer-type-name">
              {mutationType.name}
            </span>
          </button>
        )}
        {subscriptionType && (
          <button
            type="button"
            className="graphiql-doc-explorer-schema-root-row"
            onClick={() =>
              push({ name: subscriptionType.name, def: subscriptionType })
            }
          >
            <MethodPill operation="subscription" aria-hidden />
            <span className="graphiql-doc-explorer-schema-root-label">
              Subscription
            </span>
            <span className="graphiql-doc-explorer-schema-root-colon">:</span>
            <span className="graphiql-doc-explorer-type-name">
              {subscriptionType.name}
            </span>
          </button>
        )}
      </div>

      {/* All schema types section */}
      <div className="graphiql-doc-explorer-schema-section-header graphiql-doc-explorer-schema-section-header--types">
        ALL SCHEMA TYPES
        <span className="graphiql-doc-explorer-schema-type-count">
          {' '}
          · {allTypes.length}
        </span>
      </div>
      <div className="graphiql-doc-explorer-schema-all-types">
        {allTypes.map(type => (
          <button
            key={type.name}
            type="button"
            className="graphiql-doc-explorer-schema-type-row"
            onClick={() => push({ name: type.name, def: type })}
          >
            <span className="graphiql-doc-explorer-type-badge">
              {getTypeKindLabel(type)}
            </span>
            <span className="graphiql-doc-explorer-schema-type-name">
              {type.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
