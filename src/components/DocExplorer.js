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
 *   - typeName: An optional prop provided when a type is clicked from
 *     QueryEditor hint object. The click triggers the document explorer to
 *     show a definition of the type clicked.
 *
 */
export class DocExplorer extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    typeName: PropTypes.string
  }

  constructor() {
    super();

    this.state = {
      width: window.localStorage.getItem('docExplorerWidth') || DEFAULT_WIDTH,
      expanded: false,
      inspectedType: null,
      inspectedCall: null
    };

    // Navigation stack to remember the definitions visited.
    this.navStack = [];
  }

  componentWillReceiveProps(nextProps) {
    // When a new typeName is received from parent component,
    // update the doc page only if the type name is different from
    // one currently being inspected.
    if (nextProps.typeName !== this.props.typeName ||
        (this.state.inspectedType &&
         nextProps.typeName !== this.state.inspectedType.name)) {
      var typeName = nextProps.typeName || this.state.inspectedType.name;
      if (typeName.endsWith('!')) {
        typeName = typeName.slice(0, typeName.length - 1);
      }
      if (typeName.startsWith('[') && typeName.endsWith(']')) {
        typeName = typeName.slice(1, typeName.length - 1);
      }

      var type = this.props.schema.getType(typeName);

      this.setState({
        expanded: this.state.inspectedType ? this.state.expanded : true,
        inspectedType: type,
        inspectedCall: null
      });

      this.navStack.push({
        id: 'type',
        elem: type
      });
    }
  }

  _generateNavBackLink() {
    var name = this.navStack.length > 1 ?
      this.navStack[this.navStack.length - 2].elem.name :
      'Main Page';
    return (
      <div className="doc-nav-back-link">
        <a onClick={this._onNavBackLinkClick.bind(this)}>
          Back To {name}
        </a>
      </div>
    );
  }

  _onToggleBtnClick() {
    this.setState({ expanded: !this.state.expanded });
  }

  _onNavBackLinkClick() {
    var newState = {
      inspectedCall: null,
      inspectedType: null
    };

    this.navStack.pop();
    if (this.navStack.length !== 0) {
      var entry = this.navStack[this.navStack.length - 1];
      switch (entry.id) {
        case 'call':
          newState.inspectedCall = entry.elem;
          break;
        case 'type':
          newState.inspectedType = entry.elem;
          break;
      }
    }

    this.setState(newState);
  }

  _onBackToMainBtnClick() {
    this.navStack = [];
    this.setState({
      inspectedType: null,
      inspectedCall: null
    });
  }

  _onClickType(type) {
    this.setState({
      inspectedType: type,
      inspectedCall: null
    });
    this.navStack.push({
      id: 'type',
      elem: type
    });
  }

  _onClickField(field) {
    this.setState({
      inspectedType: null,
      inspectedCall: field
    });
    this.navStack.push({
      id: 'call',
      elem: field
    });
  }

  _onResizeStart(downEvent) {
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
              className="doc-explorer-toggle-button"
              onClick={this._onToggleBtnClick.bind(this)}>
              Docs
            </button>
          </div>
          <div className="doc-explorer-contents" />
        </div>
      );
    }

    var schema = this.props.schema;
    var type = this.state.inspectedType;
    var call = this.state.inspectedCall;

    var navBackLinkJSX;
    if (this.navStack.length > 0) {
      navBackLinkJSX = this._generateNavBackLink();
    }

    var content;
    if (type) {
      content =
        <TypeDoc
          key={type.name}
          type={type}
          onClickType={this._onClickType.bind(this)}
          onClickField={this._onClickField.bind(this)}
        />;
    } else if (call) {
      content =
        <FieldDoc
          key={call.name}
          field={call}
          onClickType={this._onClickType.bind(this)}
        />;
    } else if (schema) {
      content =
        <SchemaDoc
          schema={schema}
          onClickType={this._onClickType.bind(this)}
        />;
    }

    return (
      <div className="doc-explorer" style={{ width: this.state.width }}>
        <div className="doc-explorer-title-bar">
          {(type || call) &&
            <button
              className="doc-back-to-main-button"
              onClick={this._onBackToMainBtnClick.bind(this)}>
              Main Page
            </button>
          }
          <button
            className="doc-explorer-toggle-button"
            onClick={this._onToggleBtnClick.bind(this)}>
            &times;
          </button>
          <div className="doc-explorer-title">
            Documentation Explorer
          </div>
        </div>
        <div className="doc-explorer-resize-bar"
          onMouseDown={this._onResizeStart.bind(this)}
        />
        <div className="doc-explorer-contents">
          {navBackLinkJSX}
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
        <div className="doc-category-item">
          query: <TypeLink type={queryType} onClick={this.props.onClickType} />
        </div>
        {mutationType &&
          <div className="doc-category-item">
            mutation: <TypeLink type={mutationType} onClick={this.props.onClickType} />
          </div>
        }
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
              <a
                className="doc-call-sign"
                onClick={event => this.props.onClickField(field, type, event)}>
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
        <div className="doc-type-title">
          {type.name}
        </div>
        <Description
          className="doc-type-description"
          markdown={type.description}
        />
        {typesDef}
        {fieldsDef}
        {valuesDef}
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
        <div className="doc-type-title">
          {field.name}
          {': '}
          <TypeLink type={field.type} onClick={this.props.onClickType} />
        </div>
        <Description
          className="doc-type-description"
          markdown={field.description}
        />
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
    <a className="doc-type" onClick={event => onClick(type, event)}>
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
