/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { ReactNode } from 'react';
import { isType, GraphQLNamedType } from 'graphql';
import {
  ExplorerFieldDef,
  useExplorerContext,
  useSchemaContext,
} from '@graphiql/react';

import FieldDoc from './DocExplorer/FieldDoc';
import SchemaDoc from './DocExplorer/SchemaDoc';
import SearchBox from './DocExplorer/SearchBox';
import SearchResults from './DocExplorer/SearchResults';
import TypeDoc from './DocExplorer/TypeDoc';

/**
 * DocExplorer
 *
 * Shows documentations for GraphQL definitions from the schema.
 *
 */
export function DocExplorer() {
  const {
    fetchError,
    isFetching,
    schema,
    validationErrors,
  } = useSchemaContext({ nonNull: true });
  const { explorerNavStack, hide, pop, push, showSearch } = useExplorerContext({
    nonNull: true,
  });

  const navItem = explorerNavStack[explorerNavStack.length - 1];

  function handleClickType(type: GraphQLNamedType) {
    push({ name: type.name, def: type });
  }

  function handleClickField(field: ExplorerFieldDef) {
    push({ name: field.name, def: field });
  }

  let content: ReactNode;
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
    content = (
      <SearchResults
        searchValue={navItem.search}
        withinType={navItem.def as GraphQLNamedType}
        schema={schema}
        onClickType={handleClickType}
        onClickField={handleClickField}
      />
    );
  } else if (explorerNavStack.length === 1) {
    content = <SchemaDoc schema={schema} onClickType={handleClickType} />;
  } else if (isType(navItem.def)) {
    content = (
      <TypeDoc
        schema={schema}
        type={navItem.def}
        onClickType={handleClickType}
        onClickField={handleClickField}
      />
    );
  } else {
    content = <FieldDoc field={navItem.def} onClickType={handleClickType} />;
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
            }}
            aria-label="Close Documentation Explorer">
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
