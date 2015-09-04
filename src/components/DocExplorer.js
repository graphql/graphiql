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
  GraphQLUnionType,
  GraphQLInterfaceType,
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

    this.EXPLORER_WIDTH = 450;
    this.state = {
      width: 'initial',
      expanded: false,
      inspectedType: null,
      inspectedCall: null
    };

    this.startPage = '';
    this.content = '';

    // Navigation stack to remember the definitions visited.
    this.navStack = [];

    // A static `Main Page` button that does not have to change.
    this.backToMainButton = (
      <button className="doc-back-to-main-button"
        style={{ marginLeft: '6px' }}
        onClick={this._onBackToMainBtnClick.bind(this)}
      >
        Main Page
      </button>
    );

    this.marked = Marked;
  }

  _renderMarkdown(text) {
    return <span
      dangerouslySetInnerHTML={
        {__html: this.marked(text)}
      }
    />;
  }

  _getTypeLink(type) {
    function introspectOfTypes(type) {
      var typeName = '';
      if (type instanceof GraphQLNonNull) {
        typeName = <span>
          {introspectOfTypes(type.ofType)}
          !
        </span>;
      } else if (type instanceof GraphQLList) {
        typeName = <span>
          [
          {introspectOfTypes(type.ofType)}
          ]
        </span>;
      } else {
        typeName = <a className="doc-type">{type.name}</a>;
      }

      return typeName;
    }

    return introspectOfTypes(type);
  }

  _renderTypeFields(type) {
    var _getTypeLink = this._getTypeLink;
    function renderField(field, from) {
      // Provide the type parenting this field as a data attribute
      // so that later when the field is clicked, a correct type can be
      // looked up and referenced to.
      return (
        <div className="doc-category-item">
          <a className="doc-call-sign" data-from-type-name={from.name}>
            {field.name}
          </a>
          <span> : </span>
          {_getTypeLink(field.type)}
        </div>
      );
    }

    var fields = type.getFields();
    var fieldsJSX = [];
    Object.keys(fields).forEach(fieldName => {
      fieldsJSX.push(
        renderField(fields[fieldName], type)
      );
    });

    return (
      {fieldsJSX}
    );
  }

  _renderTypeValues(type) {
    var _renderMarkdown = this._renderMarkdown.bind(this);
    function renderValue(value) {
      return (
        <div className="doc-category-item">
          <div className="doc-value-name">
            {value.name} = {value.value}
          </div>
          <div className="doc-value-description">
            {_renderMarkdown(value.description || 'Self descriptive.')}
          </div>
        </div>
      );
    }

    var values = type.getValues();
    var valuesJSX = [];
    for (var value of values) {
      valuesJSX.push(renderValue(value));
    }

    return (
      {valuesJSX}
    );
  }

  _renderTypes(types) {
    function renderType(type) {
      return (
        <div className="doc-category-item">
          <a className="doc-type">{type.name}</a>
        </div>
      );
    }

    var typesJSX = [];
    for (var type of types) {
      typesJSX.push(renderType(type));
    }

    return (
      {typesJSX}
    );
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.schema && nextProps.schema !== this.props.schema) {
      this.startPage = this._generateStartPage(nextProps.schema);
    }

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
        width: this.state.inspectedType ?
          this.state.width : this.EXPLORER_WIDTH,
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

  _generateStartPage(schema) {
    var queryType = schema.getQueryType();
    var mutationType = schema.getMutationType();

    var typesJSX = this._renderTypes([ queryType, mutationType ]);

    return (
      <div className="doc-category">
        {typesJSX}
      </div>
    );
  }

  _generateTypePage(type) {
    var fieldsDef = '';
    var valuesDef = '';

    var types;
    var typesDefTitle = '';

    if (type instanceof GraphQLUnionType) {
      types = this._renderTypes(type.getPossibleTypes());
      typesDefTitle = 'possible types';
    } else if (type instanceof GraphQLInterfaceType) {
      types = this._renderTypes(type.getPossibleTypes());
      typesDefTitle = 'implemented by';
    } else if (type.getInterfaces && type.getInterfaces().length > 0) {
      types = this._renderTypes(type.getInterfaces());
      typesDefTitle = 'interfaces';
    }

    var typesDef = types ? (
      <div className="doc-category">
        <div className="doc-category-title">
          {typesDefTitle}
        </div>
        {types}
      </div>
    ) : '';

    if (type.getFields) {
      fieldsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            fields
          </div>
          {this._renderTypeFields(type)}
        </div>
      );
    }
    if (type.getValues) {
      valuesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            values
          </div>
          {this._renderTypeValues(type)}
        </div>
      );
    }

    return (
      <div>
        <div className="doc-type-title">
          {type.name}
        </div>
        <div className="doc-type-description">
          {this._renderMarkdown(type.description || 'Self descriptive.')}
        </div>
        {typesDef}
        {fieldsDef}
        {valuesDef}
      </div>
    );
  }

  _generateCallPage(call) {
    var argsJSX = [];
    var argsDef = '';
    if (call.args && call.args.length > 0) {
      for (var arg of call.args) {
        argsJSX.push(
          <div>
            <div className="doc-value-title">
              {this._getTypeLink(arg.type)}
              {" "}
              <span className="doc-value-name">{arg.name}</span>
            </div>
            <div className="doc-value-description">
              {this._renderMarkdown(arg.description || 'Self descriptive.')}
            </div>
          </div>
        );
      }
      argsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            arguments
          </div>
          {argsJSX}
        </div>
      );
    }

    return (
      <div>
        <div className="doc-type-title">
          {call.name}
          <span> : </span>
          {this._getTypeLink(call.type)}
        </div>
        <div className="doc-type-description">
          {this._renderMarkdown(call.description || 'Self descriptive.')}
        </div>
        {argsDef}
      </div>
    );
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
    this.setState({
      width: this.state.expanded ? 'initial' : this.EXPLORER_WIDTH,
      expanded: !this.state.expanded
    });
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

  _onDefClick(event) {
    var target = event.target;
    var typeName;
    if (target && target.tagName === 'A') {
      switch (target.className) {
        case 'doc-call-sign':
          typeName = target.getAttribute('data-from-type-name');
          var fields = this.props.schema.getType(typeName).getFields();
          var callName = target.innerHTML;
          this.setState({
            inspectedType: null,
            inspectedCall: fields[callName]
          });
          this.navStack.push({
            id: 'call',
            elem: fields[callName]
          });
          break;
        case 'doc-type':
          typeName = target.innerHTML;
          var type = this.props.schema.getType(typeName);
          this.setState({
            inspectedType: type,
            inspectedCall: null
          });
          this.navStack.push({
            id: 'type',
            elem: type
          });
          break;
        default:
          break;
      }
    }
  }

  render() {
    var type = this.state.inspectedType;
    var call = this.state.inspectedCall;
    var navBackLinkJSX = '';
    if (this.state.expanded) {
      if (type) {
        this.content = this._generateTypePage(type);
      } else if (call) {
        this.content = this._generateCallPage(call);
      } else {
        this.content = this.startPage;
      }

      if (this.navStack.length > 0) {
        navBackLinkJSX = this._generateNavBackLink();
      }
    } else {
      this.content = '';
    }

    return (
      <div className="doc-explorer" style={{ width: this.state.width }}>
        <div className="doc-explorer-title-bar">
          <button
            className="doc-explorer-toggle-button"
            onClick={this._onToggleBtnClick.bind(this)}
          >
            {this.state.expanded ? 'Hide' : 'Docs'}
          </button>
          {(this.state.expanded && (type || call)) && this.backToMainButton}
          <div className="doc-explorer-title"
            style={{ display: this.state.expanded ? 'block' : 'none' }}
          >
            Documentation Explorer
          </div>
        </div>
        <div className="doc-explorer-contents"
          onClick={this._onDefClick.bind(this)}
        >
          {navBackLinkJSX}
          {this.content}
        </div>
      </div>
    );
  }
}
