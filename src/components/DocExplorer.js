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
  GraphQLList,
  GraphQLNonNull
} from 'graphql/type';


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

  // Public API
  showDoc(typeOrField) {
    var navStack = this.state.navStack;
    var isCurrentlyShown =
      navStack.length > 0 && navStack[navStack.length - 1] === typeOrField;
    if (!isCurrentlyShown) {
      navStack = navStack.concat([ typeOrField ]);
    }
    this.setState({ navStack });
  }

  constructor() {
    super();

    this.state = { navStack: [] };
  }

  _onToggleBtnClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  _onNavBackClick = () => {
    this.setState({ navStack: this.state.navStack.slice(0, -1) });
  }

  _onClickTypeOrField = typeOrField => {
    this.showDoc(typeOrField);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.schema !== nextProps.schema ||
      this.state.navStack !== nextState.navStack
    );
  }

  render() {
    var schema = this.props.schema;
    var navStack = this.state.navStack;

    var typeOrField;
    if (navStack.length > 0) {
      typeOrField = navStack[navStack.length - 1];
    }

    var title;
    var content;
    if (typeOrField) {
      title = typeOrField.name;
      content = isType(typeOrField) ?
        <TypeDoc
          key={typeOrField.name}
          type={typeOrField}
          onClickType={this._onClickTypeOrField}
          onClickField={this._onClickTypeOrField}
        /> :
        <FieldDoc
          key={typeOrField.name}
          field={typeOrField}
          onClickType={this._onClickTypeOrField}
        />;
    } else if (schema) {
      title = 'Documentation Explorer';
      content =
        <SchemaDoc
          schema={schema}
          onClickType={this._onClickTypeOrField}
        />;
    }

    var prevName;
    if (navStack.length === 1) {
      prevName = 'Schema';
    } else if (navStack.length > 1) {
      prevName = navStack[navStack.length - 2].name;
    }

    var spinnerDiv = (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

    return (
      <div className="doc-explorer">
        <div className="doc-explorer-title-bar">
          {prevName &&
            <div className="doc-explorer-back" onClick={this._onNavBackClick}>
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
          {this.props.schema ? content : spinnerDiv}
        </div>
      </div>
    );
  }
}

// Render the top level Schema
class SchemaDoc extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.schema !== nextProps.schema;
  }

  render() {
    var schema = this.props.schema;
    var queryType = schema.getQueryType();
    var mutationType = schema.getMutationType && schema.getMutationType();
    var subscriptionType =
      schema.getSubscriptionType && schema.getSubscriptionType();

    return (
      <div>
        <Description
          className="doc-type-description"
          markdown={
            'A GraphQL schema provides a root type for each kind of operation.'
          }
        />
        <div className="doc-category">
          <div className="doc-category-title">
            root types
          </div>
          <div className="doc-category-item">
            <span className="keyword">query</span>
            {': '}
            <TypeLink type={queryType} onClick={this.props.onClickType} />
          </div>
          {mutationType &&
            <div className="doc-category-item">
              <span className="keyword">mutation</span>
              {': '}
              <TypeLink type={mutationType} onClick={this.props.onClickType} />
            </div>}
          {subscriptionType &&
            <div className="doc-category-item">
              <span className="keyword">subscription</span>
              {': '}
              <TypeLink
                type={subscriptionType}
                onClick={this.props.onClickType}
              />
            </div>}
        </div>
      </div>
    );
  }
}

// Documentation for a Type
class TypeDoc extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.type !== nextProps.type;
  }

  render() {
    var type = this.props.type;
    var onClickType = this.props.onClickType || () => {};
    var onClickField = this.props.onClickField || () => {};

    var typesTitle;
    var types;
    if (type instanceof GraphQLUnionType) {
      typesTitle = 'possible types';
      types = type.getPossibleTypes();
    } else if (type instanceof GraphQLInterfaceType) {
      typesTitle = 'implementations';
      types = type.getPossibleTypes();
    } else if (type instanceof GraphQLObjectType) {
      typesTitle = 'implements';
      types = type.getInterfaces();
    }

    var typesDef;
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
    var fieldsDef;
    if (type.getFields) {
      var fieldMap = type.getFields();
      var fields = Object.keys(fieldMap).map(name => fieldMap[name]);
      fieldsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            fields
          </div>
          {fields.map(field => {

            // Field arguments
            var argsDef;
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
                {argsDef && [ '(', <span>{argsDef}</span>, ')' ]}
                {': '}
                <TypeLink type={field.type} onClick={onClickType} />
              </div>
            );
          })}
        </div>
      );
    }

    var valuesDef;
    if (type instanceof GraphQLEnumType) {
      valuesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            values
          </div>
          {type.getValues().map(value =>
            <div key={value.name} className="doc-category-item">
              <div className="enum-value">
                {value.name}
              </div>
              <Description
                className="doc-value-description"
                markdown={value.description}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <Description
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
  shouldComponentUpdate(nextProps) {
    return this.props.field !== nextProps.field;
  }

  render() {
    var field = this.props.field;

    var argsDef;
    if (field.args && field.args.length > 0) {
      argsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            arguments
          </div>
          {field.args.map(arg =>
            <div key={arg.name} className="doc-category-item">
              <div>
                <span className="arg-name">{arg.name}</span>
                {': '}
                <TypeLink type={arg.type} onClick={this.props.onClickType} />
              </div>
              <Description
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
        <Description
          className="doc-type-description"
          markdown={field.description || 'No Description'}
        />
        <div className="doc-category">
          <div className="doc-category-title">
            type
          </div>
          <TypeLink type={field.type} onClick={this.props.onClickType} />
        </div>
        {argsDef}
      </div>
    );
  }
}

// Renders a type link
class TypeLink extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.type !== nextProps.type;
  }

  render() {
    return renderType(this.props.type, this.props.onClick);
  }
}

function renderType(type, onClick) {
  if (type instanceof GraphQLNonNull) {
    return <span>{renderType(type.ofType, onClick)}!</span>;
  }
  if (type instanceof GraphQLList) {
    return <span>[{renderType(type.ofType, onClick)}]</span>;
  }
  return (
    <a className="type-name" onClick={event => onClick(type, event)}>
      {type.name}
    </a>
  );
}

// Renders a description
class Description extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.markdown !== nextProps.markdown;
  }

  render() {
    var markdown = this.props.markdown;
    if (!markdown) {
      return <div />;
    }

    var html = Marked(markdown);
    return <div
      className={this.props.className}
      dangerouslySetInnerHTML={{ __html: html }}
    />;
  }
}
