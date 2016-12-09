/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import Marked from 'marked';
import {
  GraphQLSchema,
  isType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
} from 'graphql';

import MarkdownContent from './DocExplorer/MarkdownContent';
import SearchBox from './DocExplorer/SearchBox';
import SearchResults from './DocExplorer/SearchResults';
import TypeLink from './DocExplorer/TypeLink';

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

    let title;
    let content;
    if (navItem) {
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
      title = 'Documentation Explorer';
      content =
        <SchemaDoc schema={schema} onClickType={this.handleClickTypeOrField} />;
    }

    let prevName;
    if (navStack.length === 1) {
      prevName = 'Schema';
    } else if (navStack.length > 1) {
      prevName = navStack[navStack.length - 2].name;
    }

    const spinnerDiv = (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

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
          {this.props.schema ? content : spinnerDiv}
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

// Render the top level Schema
class SchemaDoc extends React.Component {

  static propTypes = {
    schema: PropTypes.object,
    onClickType: PropTypes.func,
  }

  shouldComponentUpdate(nextProps) {
    return this.props.schema !== nextProps.schema;
  }

  render() {
    const schema = this.props.schema;
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType && schema.getMutationType();
    const subscriptionType =
      schema.getSubscriptionType && schema.getSubscriptionType();

    return (
      <div>
        <MarkdownContent
          className="doc-type-description"
          markdown={
            'A GraphQL schema provides a root type for each kind of operation.'
          }
        />
        <div className="doc-category">
          <div className="doc-category-title">
            {'root types'}
          </div>
          <div className="doc-category-item">
            <span className="keyword">{'query'}</span>
            {': '}
            <TypeLink type={queryType} onClick={this.props.onClickType} />
          </div>
          {
            mutationType &&
            <div className="doc-category-item">
              <span className="keyword">{'mutation'}</span>
              {': '}
              <TypeLink type={mutationType} onClick={this.props.onClickType} />
            </div>
          }
          {
            subscriptionType &&
            <div className="doc-category-item">
              <span className="keyword">{'subscription'}</span>
              {': '}
              <TypeLink
                type={subscriptionType}
                onClick={this.props.onClickType}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

// Documentation for a Type
class TypeDoc extends React.Component {

  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    type: PropTypes.object,
    onClickType: PropTypes.func,
    onClickField: PropTypes.func,
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.type !== nextProps.type ||
      this.props.schema !== nextProps.schema
    );
  }

  render() {
    const schema = this.props.schema;
    const type = this.props.type;
    const onClickType = this.props.onClickType;
    const onClickField = this.props.onClickField;

    let typesTitle;
    let types;
    if (type instanceof GraphQLUnionType) {
      typesTitle = 'possible types';
      types = schema.getPossibleTypes(type);
    } else if (type instanceof GraphQLInterfaceType) {
      typesTitle = 'implementations';
      types = schema.getPossibleTypes(type);
    } else if (type instanceof GraphQLObjectType) {
      typesTitle = 'implements';
      types = type.getInterfaces();
    }

    let typesDef;
    if (types && types.length > 0) {
      typesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            {typesTitle}
          </div>
          {types.map(subtype =>
            <div key={subtype.name} className="doc-category-item">
              <TypeLink type={subtype} onClick={onClickType} />
            </div>
          )}
        </div>
      );
    }

    // InputObject and Object
    let fieldsDef;
    if (type.getFields) {
      const fieldMap = type.getFields();
      const fields = Object.keys(fieldMap).map(name => fieldMap[name]);
      fieldsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            {'fields'}
          </div>
          {fields.map(field => {

            // Field arguments
            let argsDef;
            if (field.args && field.args.length > 0) {
              argsDef = field.args.map(arg =>
                <span className="arg" key={arg.name}>
                  <span className="arg-name">{arg.name}</span>
                  {': '}
                  <TypeLink type={arg.type} onClick={onClickType} />
                </span>
              );
            }

            return (
              <div key={field.name} className="doc-category-item">
                <a
                  className="field-name"
                  onClick={event => onClickField(field, type, event)}>
                  {field.name}
                </a>
                {argsDef && [ '(', <span key="args">{argsDef}</span>, ')' ]}
                {': '}
                <TypeLink type={field.type} onClick={onClickType} />
                {
                  (field.isDeprecated || field.deprecationReason) &&
                  <span className="doc-alert-text">{' (DEPRECATED)'}</span>
                }
              </div>
            );
          })}
        </div>
      );
    }

    let valuesDef;
    if (type instanceof GraphQLEnumType) {
      valuesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            {'values'}
          </div>
          {type.getValues().map(value =>
            <div key={value.name} className="doc-category-item">
              <div className="enum-value">
                {value.name}
                {
                  (value.isDeprecated || value.deprecationReason) &&
                  <span className="doc-alert-text">{' (DEPRECATED)'}</span>
                }
              </div>
              <MarkdownContent
                className="doc-value-description"
                markdown={value.description}
              />
              {
                value.deprecationReason &&
                <MarkdownContent
                  className="doc-alert-text"
                  markdown={value.deprecationReason}
                />
              }
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <MarkdownContent
          className="doc-type-description"
          markdown={type.description || 'No Description'}
        />
        {(type instanceof GraphQLObjectType) && typesDef}
        {fieldsDef}
        {valuesDef}
        {!(type instanceof GraphQLObjectType) && typesDef}
      </div>
    );
  }
}

// Documentation for a field
class FieldDoc extends React.Component {

  static propTypes = {
    field: PropTypes.object,
    onClickType: PropTypes.func,
  }

  shouldComponentUpdate(nextProps) {
    return this.props.field !== nextProps.field;
  }

  render() {
    const field = this.props.field;

    let argsDef;
    if (field.args && field.args.length > 0) {
      argsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            {'arguments'}
          </div>
          {field.args.map(arg =>
            <div key={arg.name} className="doc-category-item">
              <div>
                <span className="arg-name">{arg.name}</span>
                {': '}
                <TypeLink type={arg.type} onClick={this.props.onClickType} />
              </div>
              <MarkdownContent
                className="doc-value-description"
                markdown={arg.description}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <MarkdownContent
          className="doc-type-description"
          markdown={field.description || 'No Description'}
        />
        {
          field.deprecationReason &&
          <MarkdownContent
            className="doc-alert-text"
            markdown={field.deprecationReason}
          />
        }
        <div className="doc-category">
          <div className="doc-category-title">
            {'type'}
          </div>
          <TypeLink type={field.type} onClick={this.props.onClickType} />
        </div>
        {argsDef}
      </div>
    );
  }
}
