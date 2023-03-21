import { isType } from 'graphql';
import { ReactNode } from 'react';

import { ChevronLeftIcon } from '../../icons';
import { useSchemaContext } from '../../schema';
import { Spinner } from '../../ui';
import { useExplorerContext } from '../context';
import { FieldDocumentation } from './field-documentation';
import { SchemaDocumentation } from './schema-documentation';
import { Search } from './search';
import { TypeDocumentation } from './type-documentation';

import './doc-explorer.css';

export function DocExplorer() {
  const { fetchError, isFetching, schema, validationErrors } = useSchemaContext(
    { nonNull: true, caller: DocExplorer },
  );
  const { explorerNavStack, pop } = useExplorerContext({
    nonNull: true,
    caller: DocExplorer,
  });

  const navItem = explorerNavStack.at(-1)!;

  let content: ReactNode = null;
  if (fetchError) {
    content = (
      <div className="graphiql-doc-explorer-error">Error fetching schema</div>
    );
  } else if (validationErrors.length > 0) {
    content = (
      <div className="graphiql-doc-explorer-error">
        Schema is invalid: {validationErrors[0].message}
      </div>
    );
  } else if (isFetching) {
    // Schema is undefined when it is being loaded via introspection.
    content = <Spinner />;
  } else if (!schema) {
    // Schema is null when it explicitly does not exist, typically due to
    // an error during introspection.
    content = (
      <div className="graphiql-doc-explorer-error">
        No GraphQL schema available
      </div>
    );
  } else if (explorerNavStack.length === 1) {
    content = <SchemaDocumentation schema={schema} />;
  } else if (isType(navItem.def)) {
    content = <TypeDocumentation type={navItem.def} />;
  } else if (navItem.def) {
    content = <FieldDocumentation field={navItem.def} />;
  }

  let prevName;
  if (explorerNavStack.length > 1) {
    prevName = explorerNavStack.at(-2)!.name;
  }

  return (
    <section
      className="graphiql-doc-explorer"
      aria-label="Documentation Explorer"
    >
      <div className="graphiql-doc-explorer-header">
        <div className="graphiql-doc-explorer-header-content">
          {prevName && (
            <a
              href="#"
              className="graphiql-doc-explorer-back"
              onClick={event => {
                event.preventDefault();
                pop();
              }}
              aria-label={`Go back to ${prevName}`}
            >
              <ChevronLeftIcon />
              {prevName}
            </a>
          )}
          <div className="graphiql-doc-explorer-title">{navItem.name}</div>
        </div>
        <Search key={navItem.name} />
      </div>
      <div className="graphiql-doc-explorer-content">{content}</div>
    </section>
  );
}
