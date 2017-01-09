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
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
} from 'graphql';

import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';

export default class TypeDoc extends React.Component {
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
