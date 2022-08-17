/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { ReactNode } from 'react';
import { GraphQLSchema, isType } from 'graphql';
import { useExplorerContext, useSchemaContext } from '@graphiql/react';

import FieldDoc from './DocExplorer/FieldDoc';
import SchemaDoc from './DocExplorer/SchemaDoc';
import SearchBox from './DocExplorer/SearchBox';
import SearchResults from './DocExplorer/SearchResults';
import TypeDoc from './DocExplorer/TypeDoc';

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

/**
 * DocExplorer
 *
 * Shows documentations for GraphQL definitions from the schema.
 *
 */
export function DocExplorer(props: DocExplorerProps) {
  const {
    fetchError,
    isFetching,
    schema: schemaFromContext,
    validationErrors,
  } = useSchemaContext({ nonNull: true });
  const { explorerNavStack, hide, pop, showSearch } = useExplorerContext({
    nonNull: true,
  });

  const navItem = explorerNavStack[explorerNavStack.length - 1];

  // The schema passed via props takes precedence until we remove the prop
  const schema = props.schema === undefined ? schemaFromContext : props.schema;

  let content: ReactNode = null;
  if (fetchError) {
    content = <div className="error-container">Error fetching schema</div>;
  } else if (validationErrors.length > 0) {
    content = (
      <div className="error-container">
        Schema is invalid: {validationErrors[0].message}
      </div>
    );
  } else if (isFetching) {
    // Schema is undefined when it is being loaded via introspection.
    content = (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  } else if (!schema) {
    // Schema is null when it explicitly does not exist, typically due to
    // an error during introspection.
    content = <div className="error-container">No Schema Available</div>;
  } else if (navItem.search) {
    content = <SearchResults />;
  } else if (explorerNavStack.length === 1) {
    content = <SchemaDoc />;
  } else if (isType(navItem.def)) {
    content = <TypeDoc />;
  } else if (navItem.def) {
    content = <FieldDoc />;
  }

  const shouldSearchBoxAppear =
    explorerNavStack.length === 1 ||
    (isType(navItem.def) && 'getFields' in navItem.def);

  let prevName;
  if (explorerNavStack.length > 1) {
    prevName = explorerNavStack[explorerNavStack.length - 2].name;
  }

  return (
    <section
      className="doc-explorer"
      key={navItem.name}
      aria-label="Documentation Explorer"
    >
      <div className="doc-explorer-title-bar">
        {prevName && (
          <button
            type="button"
            className="doc-explorer-back"
            onClick={pop}
            aria-label={`Go back to ${prevName}`}
          >
            {prevName}
          </button>
        )}
        <div className="doc-explorer-title">
          {navItem.title || navItem.name}
        </div>
        <div className="doc-explorer-rhs">
          <button
            type="button"
            className="docExplorerHide"
            onClick={() => {
              hide();
              props.onClose?.();
            }}
            aria-label="Close Documentation Explorer"
          >
            {'\u2715'}
          </button>
        </div>
      </div>
      <div className="doc-explorer-contents">
        {shouldSearchBoxAppear && (
          <SearchBox
            value={navItem.search}
            placeholder={`Search ${navItem.name}...`}
            onSearch={showSearch}
          />
        )}
        {content}
      </div>
    </section>
  );
}
