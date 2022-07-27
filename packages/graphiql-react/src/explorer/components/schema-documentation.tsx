import { useSchemaContext } from '../../schema';
import { MarkdownContent } from '../../ui';
import { TypeLink } from './type-link';

export function SchemaDocumentation() {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: SchemaDocumentation,
  });

  if (!schema) {
    return null;
  }

  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType?.();
  const subscriptionType = schema.getSubscriptionType?.();

  return (
    <div>
      <MarkdownContent type="description">
        {schema.description ||
          'A GraphQL schema provides a root type for each kind of operation.'}
      </MarkdownContent>
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
