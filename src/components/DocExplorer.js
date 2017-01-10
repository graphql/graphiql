/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import {
  GraphQLSchema,
  isType,
} from 'graphql';

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
 * Props:
 *
 *   - schema: A required GraphQLSchema instance that provides GraphQL document
 *     definitions.
 *
 * Children:
 *
 *   - Any provided children will be positioned in the right-hand-side of the
 *     top bar. Typically this will be a "close" button for temporary explorer.
 *
 */
export class DocExplorer extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
  }

  constructor() {
    super();

    this.state = { navStack: [] };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.schema !== nextProps.schema ||
      this.state.navStack !== nextState.navStack ||
      this.state.searchValue !== nextState.searchValue
    );
  }

  render() {
    const schema = this.props.schema;
    const navStack = this.state.navStack;

    let navItem;
    if (navStack.length > 0) {
      navItem = navStack[navStack.length - 1];
    }

    let title = 'Documentation Explorer';
    let content;
    if (schema === undefined) {
      // Schema is undefined when it is being loaded via introspection.
      content =
        <div className="spinner-container">
          <div className="spinner" />
        </div>;
    } else if (schema === null) {
      // Schema is null when it explicitly does not exist, typically due to
      // an error during introspection.
      content =
        <div className="error-container">
          {'No Schema Available'}
        </div>;
    } else if (navItem) {
      if (navItem.name === 'Search Results') {
        title = navItem.name;
        content =
          <SearchResults
            searchValue={navItem.searchValue}
            schema={schema}
            onClickType={this.handleClickTypeOrField}
            onClickField={this.handleClickTypeOrField}
          />;
      } else {
        title = navItem.name;
        if (isType(navItem)) {
          content =
            <TypeDoc
              key={navItem.name}
              schema={schema}
              type={navItem}
              onClickType={this.handleClickTypeOrField}
              onClickField={this.handleClickTypeOrField}
            />;
        } else {
          content =
            <FieldDoc
              key={navItem.name}
              field={navItem}
              onClickType={this.handleClickTypeOrField}
            />;
        }
      }
    } else if (schema) {
      content =
        <SchemaDoc schema={schema} onClickType={this.handleClickTypeOrField} />;
    }

    let prevName;
    if (navStack.length === 1) {
      prevName = 'Schema';
    } else if (navStack.length > 1) {
      prevName = navStack[navStack.length - 2].name;
    }

    const shouldSearchBoxAppear = content && (
      content.type === SearchResults || content.type === SchemaDoc
    );

    return (
      <div className="doc-explorer">
        <div className="doc-explorer-title-bar">
          {
            prevName &&
            <div
              className="doc-explorer-back"
              onClick={this.handleNavBackClick}>
              {prevName}
            </div>
          }
          <div className="doc-explorer-title">
            {title}
          </div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>
        <div className="doc-explorer-contents">
          <SearchBox
            isShown={shouldSearchBoxAppear}
            onSearch={this.handleSearch}
          />
          {content}
        </div>
      </div>
    );
  }

  // Public API
  showDoc(typeOrField) {
    let navStack = this.state.navStack;
    const isCurrentlyShown =
      navStack.length > 0 && navStack[navStack.length - 1] === typeOrField;
    if (!isCurrentlyShown) {
      navStack = navStack.concat([ typeOrField ]);
    }

    this.setState({ navStack });
  }

  // Public API
  showSearch(searchItem) {
    let navStack = this.state.navStack;
    const lastEntry = navStack.length > 0 && navStack[navStack.length - 1];
    if (!lastEntry) {
      navStack = navStack.concat([ searchItem ]);
    } else if (lastEntry.searchValue !== searchItem.searchValue) {
      navStack = navStack.slice(0, -1).concat([ searchItem ]);
    }

    this.setState({ navStack });
  }

  handleNavBackClick = () => {
    this.setState({ navStack: this.state.navStack.slice(0, -1) });
  }

  handleClickTypeOrField = typeOrField => {
    this.showDoc(typeOrField);
  }

  handleSearch = value => {
    this.showSearch({
      name: 'Search Results',
      searchValue: value
    });
  }
}
