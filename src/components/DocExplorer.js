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
import { getLeft } from '../utility/elementPosition';


const CLOSED_WIDTH = 75;
const MIN_WIDTH = 200;
const DEFAULT_WIDTH = 350;
const MAX_WIDTH = 650;

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
 */
export class DocExplorer extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
  }

  constructor() {
    super();

    this.state = {
      width: window.localStorage.getItem('docExplorerWidth') || DEFAULT_WIDTH,
      expanded: false,
      navStack: []
    };
  }

  // Public API
  showDoc(typeOrField) {
    var navStack = this.state.navStack;
    var isCurrentlyShown =
      navStack.length > 0 && navStack[navStack.length - 1] === typeOrField;
    if (!isCurrentlyShown) {
      navStack = navStack.concat([ typeOrField ]);
    }
    this.setState({ expanded: true, navStack });
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

  _onResizeStart = downEvent => {
    downEvent.preventDefault();

    var hadWidth = this.state.width;
    var offset = downEvent.clientX - getLeft(downEvent.target);

    var onMouseMove = moveEvent => {
      var docExplorerBar = React.findDOMNode(this);
      var leftSize = moveEvent.clientX - getLeft(docExplorerBar) - offset;
      var rightSize = docExplorerBar.clientWidth - leftSize;

      if (rightSize < MIN_WIDTH) {
        this.setState({ expanded: false });
      } else {
        this.setState({
          expanded: true,
          width: Math.min(rightSize, MAX_WIDTH)
        });
      }
    };

    var onMouseUp = () => {
      if (this.state.expanded) {
        window.localStorage.setItem('docExplorerWidth', this.state.width);
      } else {
        this.setState({ width: hadWidth });
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  render() {
    if (!this.state.expanded) {
      return (
        <div className="doc-explorer" style={{ width: CLOSED_WIDTH }}>
          <div className="doc-explorer-title-bar">
            <button
              className="doc-explorer-button"
              onClick={this._onToggleBtnClick}>
              Docs
            </button>
          </div>
          <div className="doc-explorer-contents" />
        </div>
      );
    }

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

    return (
      <div className="doc-explorer" style={{ width: this.state.width }}>
        <div className="doc-explorer-title-bar">
          {prevName &&
            <div className="doc-explorer-back" onClick={this._onNavBackClick}>
              {prevName}
            </div>
          }
          <div className="doc-explorer-hide" onClick={this._onToggleBtnClick}>
            &#x2715;
          </div>
          <div className="doc-explorer-title">
            {title}
          </div>
        </div>
        <div className="doc-explorer-resize-bar"
          onMouseDown={this._onResizeStart}
        />
        <div className="doc-explorer-contents">
          {content}
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
    var mutationType = schema.getMutationType();

    return (
      <div>
        <div className="doc-category">
          <div className="doc-category-title">
            root types
          </div>
          <div className="doc-category-item">
            {'query: '}
            <TypeLink type={queryType} onClick={this.props.onClickType} />
          </div>
          {mutationType &&
            <div className="doc-category-item">
              {'mutation: '}
              <TypeLink type={mutationType} onClick={this.props.onClickType} />
            </div>
          }
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
              <TypeLink type={subtype} onClick={this.props.onClickType} />
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
          {fields.map(field =>
            // Provide the type parenting this field as a data attribute
            // so that later when the field is clicked, a correct type can be
            // looked up and referenced to.
            <div key={field.name} className="doc-category-item">
              <a onClick={event => this.props.onClickField(field, type, event)}>
                {field.name}
              </a>
              {': '}
              <TypeLink type={field.type} onClick={this.props.onClickType} />
            </div>
          )}
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
              <div className="doc-value-name">
                {value.name}
              </div>
              <Description
                className="doc-value-description"
                markdown={type.description}
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
            <div key={arg.name}>
              <div className="doc-value-title">
                <span className="doc-value-name">{arg.name}</span>
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
  return <a onClick={event => onClick(type, event)}>{type.name}</a>;
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
