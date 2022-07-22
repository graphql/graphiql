import { GraphQLSchema, isType } from 'graphql';
import { ReactNode } from 'react';

import { useSchemaContext } from '../../schema';
import { Spinner } from '../../ui';
import { useExplorerContext } from '../context';
import { FieldDocumentation } from './field-documentation';
import { SchemaDocumentation } from './schema-documentation';
import { Search } from './search';
import { TypeDocumentation } from './type-documentation';

type DocExplorerProps = {
  onClose?(): void;
  /**
   * @deprecated Passing a schema prop directly to this component will be
   * removed in the next major version. Instead you need to wrap this component
   * with the `SchemaContextProvider` from `@graphiql/react`. This context
   * provider accepts a `schema` prop that you can use to skip fetching the
   * schema with an introspection request.
   */
  schema?: GraphQLSchema | null;
};

export function DocExplorer(props: DocExplorerProps) {
  const {
    fetchError,
    isFetching,
    schema: schemaFromContext,
    validationErrors,
  } = useSchemaContext({ nonNull: true, caller: DocExplorer });
  const { explorerNavStack, hide, pop } = useExplorerContext({
    nonNull: true,
    caller: DocExplorer,
  });

  const navItem = explorerNavStack[explorerNavStack.length - 1];

  // The schema passed via props takes precedence until we remove the prop
  const schema = props.schema === undefined ? schemaFromContext : props.schema;

  let content: ReactNode = null;
  if (fetchError) {
    content = <div className="error-container">Error fetching schema</div>;
  } else if (validationErrors) {
    content = (
      <div className="error-container">
        Schema is invalid: {validationErrors[0].message}
      </div>
    );
  } else if (isFetching) {
    // Schema is undefined when it is being loaded via introspection.
    content = <Spinner />;
  } else if (!schema) {
    // Schema is null when it explicitly does not exist, typically due to
    // an error during introspection.
    content = <div className="error-container">No Schema Available</div>;
  } else if (explorerNavStack.length === 1) {
    content = <SchemaDocumentation schema={schema} />;
  } else if (isType(navItem.def)) {
    content = <TypeDocumentation type={navItem.def} />;
  } else if (navItem.def) {
    content = <FieldDocumentation field={navItem.def} />;
  }

  let prevName;
  if (explorerNavStack.length > 1) {
    prevName = explorerNavStack[explorerNavStack.length - 2].name;
  }

  return (
    <section
      className="doc-explorer"
      key={navItem.name}
      aria-label="Documentation Explorer">
      <div className="doc-explorer-title-bar">
        {prevName && (
          <button
            className="doc-explorer-back"
            onClick={pop}
            aria-label={`Go back to ${prevName}`}>
            {prevName}
          </button>
        )}
        <div className="doc-explorer-title">
          {navItem.title || navItem.name}
        </div>
        <div className="doc-explorer-rhs">
          <button
            className="docExplorerHide"
            onClick={() => {
              hide();
              props.onClose?.();
            }}
            aria-label="Close Documentation Explorer">
            {'\u2715'}
          </button>
        </div>
      </div>
      <div className="doc-explorer-contents">
        <Search key={navItem.def?.name || '__schema'} />
        {content}
      </div>
    </section>
  );
}
