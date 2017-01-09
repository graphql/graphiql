/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';

import TypeLink from './TypeLink';

export default class SearchResults extends React.Component {
  static propTypes = {
    schema: PropTypes.object,
    searchValue: PropTypes.string,
    onClickType: PropTypes.func,
    onClickField: PropTypes.func,
  }

  shouldComponentUpdate(nextProps) {
    return this.props.schema !== nextProps.schema ||
      this.props.searchValue !== nextProps.searchValue;
  }

  render() {
    const searchValue = this.props.searchValue;
    const schema = this.props.schema;
    const onClickType = this.props.onClickType;
    const onClickField = this.props.onClickField;

    const typeMap = schema.getTypeMap();

    const matchedTypes = [];
    const matchedFields = [];

    const typeNames = Object.keys(typeMap);
    for (const typeName of typeNames) {
      if (matchedTypes.length + matchedFields.length >= 100) {
        break;
      }

      const type = typeMap[typeName];
      const matchedOn = [];
      if (this._isMatch(typeName, searchValue)) {
        matchedOn.push('Type Name');
      }

      if (matchedOn.length) {
        matchedTypes.push(
          <div className="doc-category-item">
            <TypeLink type={type} onClick={onClickType} />
          </div>
        );
      }

      if (type.getFields) {
        const fields = type.getFields();
        Object.keys(fields).forEach(fieldName => {
          const field = fields[fieldName];
          if (this._isMatch(fieldName, searchValue)) {
            matchedFields.push(
              <div className="doc-category-item">
                <a className="field-name"
                  onClick={event => onClickField(field, type, event)}>
                  {field.name}
                </a>
                {' on '}
                <TypeLink type={type} onClick={onClickType} />
              </div>
            );
          } else if (field.args && field.args.length) {
            const matches =
              field.args.filter(arg => this._isMatch(arg.name, searchValue));
            if (matches.length > 0) {
              matchedFields.push(
                <div className="doc-category-item">
                  <a className="field-name"
                    onClick={event => onClickField(field, type, event)}>
                    {field.name}
                  </a>
                  {'('}
                  <span>
                    {matches.map(arg =>
                      <span className="arg" key={arg.name}>
                        <span className="arg-name">{arg.name}</span>
                        {': '}
                        <TypeLink type={arg.type} onClick={onClickType} />
                      </span>
                    )}
                  </span>
                  {')'}
                  {' on '}
                  <TypeLink type={type} onClick={onClickType} />
                </div>
              );
            }
          }
        });
      }
    }

    if (matchedTypes.length === 0 && matchedFields.length === 0) {
      return (
        <span className="doc-alert-text">
          {'No results found.'}
        </span>
      );
    }

    return (
      <div>
        <div className="doc-category">
          {
            (matchedTypes.length > 0 || matchedFields.length > 0) &&
            <div className="doc-category-title">
              {'search results'}
            </div>
          }
          {matchedTypes}
          {matchedFields}
        </div>
      </div>
    );
  }

  _isMatch(sourceText, searchValue) {
    try {
      const escaped = searchValue.replace(/[^_0-9A-Za-z]/g, ch => '\\' + ch);
      return sourceText.search(new RegExp(escaped, 'i')) !== -1;
    } catch (e) {
      return sourceText.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
    }
  }
}
