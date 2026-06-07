import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';
import { parse, print } from 'graphql';
import { type FC, useMemo } from 'react';
import { toggleFieldSelection } from '../lib/document-mutator';
import { FieldTree } from './field-tree';
import './../index.css';

/**
 * Parse the current query text into a DocumentNode, falling back to a
 * minimal valid document if the text is empty or unparseable.
 */
function parseOrEmpty(text: string | null | undefined) {
  const src = text?.trim();
  if (!src) {
    return parse('{ __typename }');
  }
  try {
    return parse(src);
  } catch {
    return parse('{ __typename }');
  }
}

export const QueryBuilder: FC = () => {
  const schema = useGraphiQL(state => state.schema);
  const queryEditor = useGraphiQL(state => state.queryEditor);
  const { updateActiveTabValues } = useGraphiQLActions();

  // Track the live editor text so checkboxes reflect real-time state.
  const activeTabIndex = useGraphiQL(state => state.activeTabIndex);
  const tabs = useGraphiQL(state => state.tabs);
  const queryText = tabs[activeTabIndex]?.query;

  const doc = useMemo(() => parseOrEmpty(queryText), [queryText]);

  function handleToggle(path: string[]) {
    const next = toggleFieldSelection(doc, path);
    const printed = print(next);
    // Drive the Monaco editor directly so the editor model stays in sync.
    if (queryEditor) {
      queryEditor.setValue(printed);
    } else {
      // Fallback: update tab state directly (editor may not be mounted yet).
      updateActiveTabValues({ query: printed });
    }
  }

  if (!schema) {
    return (
      <div className="graphiql-query-builder">
        <p className="graphiql-qb-empty">No schema loaded.</p>
      </div>
    );
  }

  const rootTypes = [
    schema.getQueryType(),
    schema.getMutationType(),
    schema.getSubscriptionType(),
  ].filter(Boolean) as NonNullable<ReturnType<typeof schema.getQueryType>>[];

  return (
    <div className="graphiql-query-builder">
      {rootTypes.map(rootType => (
        <section key={rootType.name} className="graphiql-qb-root-section">
          <h3 className="graphiql-qb-root-name">{rootType.name}</h3>
          <FieldTree
            type={rootType}
            path={[]}
            doc={doc}
            onToggle={handleToggle}
          />
        </section>
      ))}
    </div>
  );
};
