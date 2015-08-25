/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import { GraphQLSchema } from 'graphql';
import { isLeafType } from 'graphql/type';


/**
 * DocExplorer
 *
 *
 * Props:
 *
 *
 */
export class DocExplorer extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    typeName: PropTypes.string
  }

  constructor() {
    super();

    this.EXPLORER_WIDTH = 350;
    this.state = {
      width: 'initial',
      expanded: false,
      currentlyInspectedType: null
    };

    this.startPage = 'Welcome to GraphQL Documentation Explorer!';
    this.content = '';
    this.backToMainButton = (
      <button className="doc-back-to-main-button"
        style={{ marginLeft: "6px" }}
        onClick={this._onBackToMainBtnClick.bind(this)}
      >
        Main Page
      </button>
    );
  }

  _renderTypeFields(type) {
    function renderField(field) {
      return (
        <div>
          <a href="javascript:void(0)">{field.name}</a>
          <span> : </span>
          <a href="javascript:void(0)">{field.type.name}</a>
        </div>
      );
    }

    var fields = type.getFields();
    var fieldsJSX = [];
    Object.keys(fields).forEach(fieldName => {
      fieldsJSX.push(
        renderField(fields[fieldName])
      );
    });

    return (
      {fieldsJSX}
    );
  }

  _renderTypeValues(type) {
    function renderValue(value) {
      return (
        <div>
          <span className="doc-value-name">{value.name}</span>
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

  // TODO: This part could be optionalized
  _generateStartPage(schema) {
    var queryType = schema.getQueryType();
    var mutationType = schema.getMutationType();
    var directives = schema.getDirectives();

    function renderDirectives() {
      return 'test';
    }

    var queryJSX = queryType ?
      <div className="doc-call-def">
        <div className="doc-category-title">
          Query
        </div>
        {this._renderTypeFields(queryType)}
      </div>
      : '';

    var mutationJSX = mutationType ?
      <div className="doc-call-def">
        <div className="doc-category-title">
          Mutation
        </div>
        {this._renderTypeFields(mutationType)}
      </div> : '';

    var directivesJSX = directives ?
      <div className="doc-call-def">
        <div className="doc-category-title">
          Directive
        </div>
        {renderDirectives(directives)}
      </div>
      : '';

    return (
      <div className="doc-table-of-contents">
        {queryJSX}
        {mutationJSX}
        {directivesJSX}
      </div>
    );
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.schema && nextProps.schema !== this.props.schema) {
      this.startPage = this._generateStartPage(nextProps.schema);
    }

    if (nextProps.typeName !== this.props.typeName) {
      var typeName = nextProps.typeName;
      if (typeName.endsWith('!')) {
        typeName = typeName.slice(0, typeName.length - 1);
      }
      if (typeName.startsWith('[') && typeName.endsWith(']')) {
        typeName = typeName.slice(1, typeName.length - 1);
      }
      this.currentlyInspectedType = this.props.schema.getTypeMap()[typeName];

      this.setState({
        width: this.EXPLORER_WIDTH,
        expanded: true,
        currentlyInspectedType: this.props.schema.getTypeMap()[typeName]
      });
    }
  }

  _generateTypePage(type) {
    var fieldsDef = '';
    var valuesDef = '';
    if (type.getFields) {
      fieldsDef = (
        <div className="doc-type-fields">
          <div className="doc-category-title">
            Fields
          </div>
          {this._renderTypeFields(type)}
        </div>
      );
    }
    if (type.getValues) {
      valuesDef = (
        <div className="doc-type-values">
          <div className="doc-category-title">
            Values
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
          {type.description || 'Type description not found.'}
        </div>
        {fieldsDef}
        {valuesDef}
      </div>
    );
  }

  _onToggleBtnClick() {
    this.setState({
      width: this.state.expanded ? 'initial' : this.EXPLORER_WIDTH,
      expanded: !this.state.expanded
    });
  }

  _onBackToMainBtnClick() {
    this.setState({
      currentlyInspectedType: null
    });
  }

  render() {
    var type = this.state.currentlyInspectedType;
    if (this.state.expanded) {
      this.content = type ?
        this._generateTypePage(type) :
        this.startPage;
    } else {
      this.content = '';
    }

    return (
      <div className="doc-explorer"
        style={{ width: this.state.width }}
      >
        <div className="doc-explorer-title-bar">
          <button
            className="doc-explorer-toggle-button"
            onClick={this._onToggleBtnClick.bind(this)}
          >
            {this.state.expanded ? 'Hide' : 'Docs'}
          </button>
          {(this.state.expanded && type) && this.backToMainButton}
          <div className="doc-explorer-title"
            style={{ display: this.state.expanded ? 'block' : 'none' }}
          >
            Documentation Explorer
          </div>
        </div>
        <div className="doc-explorer-contents">
          {this.content}
        </div>
      </div>
    );
  }
}
