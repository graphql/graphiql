/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import React from 'react';


/**
 * DocExplorer
 *
 *
 * Props:
 *
 *
 */
export class DocExplorer extends React.Component {
  constructor() {
    super();

    this.EXPLORER_WIDTH = 400;
    this.currentlyInspectedType = null;
    this.state = {
      width: 'initial',
      expanded: false
    };

    this.startPage = 'Welcome to GraphQL Documentation Explorer!';
    this.content = '';
  }

  _renderTypeDefinitions(type) {
    function renderField(field) {
      return (
        <div>
          <a href="#">{field.name}</a>
          <span> : </span>
          <a href="#">{field.type.name}</a>
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
        <div className="doc-type-title">
          Query
        </div>
        {this._renderTypeDefinitions(queryType)}
      </div>
      : '';

    var mutationJSX = mutationType ?
      <div className="doc-call-def">
        <div className="doc-type-title">
          Mutation
        </div>
        {this._renderTypeDefinitions(mutationType)}
      </div> : '';

    var directivesJSX = directives ?
      <div className="doc-call-def">
        <div className="doc-type-title">
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
      this.currentlyInspectedType = this.props.schema.getTypeMap[typeName];

      this.setState({
        width: this.EXPLORER_WIDTH,
        expanded: true
      });
    }
  }

  _onToggleBtnClick() {
    this.setState({
      width: this.state.expanded ? 'initial' : this.EXPLORER_WIDTH,
      expanded: !this.state.expanded
    });
  }

  render() {
    if (this.state.expanded) {
      this.content = this.currentlyInspectedType ?
        this.currentlyInspectedType.description ||
        'Type description not found.' :
        this.startPage;
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
