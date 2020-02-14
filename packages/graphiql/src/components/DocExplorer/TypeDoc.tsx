/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { ReactNode } from 'react';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLType,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputField,
} from 'graphql';

import Argument from './Argument';
import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';
import DefaultValue from './DefaultValue';

type TypeDocProps = {
  schema: GraphQLSchema;
  type: GraphQLType;
  onClickType: () => void;
  onClickField: () => void;
};

type TypeDocState = {
  showDeprecated: boolean;
};

export default class TypeDoc extends React.Component<
  TypeDocProps,
  TypeDocState
> {
  constructor(props: TypeDocProps) {
    super(props);
    this.state = { showDeprecated: false };
  }

  shouldComponentUpdate(nextProps: TypeDocProps, nextState: TypeDocState) {
    return (
      this.props.type !== nextProps.type ||
      this.props.schema !== nextProps.schema ||
      this.state.showDeprecated !== nextState.showDeprecated
    );
  }

  render() {
    const schema = this.props.schema;
    const type = this.props.type;
    const onClickType = this.props.onClickType;
    const onClickField = this.props.onClickField;

    let typesTitle: string | null = null;
    let types: readonly GraphQLObjectType[] | GraphQLInterfaceType[] = [];
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
          <div className="doc-category-title">{typesTitle}</div>
          {types.map(subtype => (
            <div key={subtype.name} className="doc-category-item">
              <TypeLink type={subtype} onClick={onClickType} />
            </div>
          ))}
        </div>
      );
    }

    // InputObject and Object
    let fieldsDef;
    let deprecatedFieldsDef;
    if ('getFields' in type) {
      const fieldMap = type.getFields();
      const fields = Object.keys(fieldMap).map(name => fieldMap[name]);
      fieldsDef = (
        <div className="doc-category">
          <div className="doc-category-title">{'fields'}</div>
          {fields
            .filter(field =>
              'isDeprecated' in field ? !field.isDeprecated : true,
            )
            .map(field => (
              <Field
                key={field.name}
                type={type}
                field={field}
                onClickType={onClickType}
                onClickField={onClickField}
              />
            ))}
        </div>
      );

      const deprecatedFields = fields.filter(field =>
        'isDeprecated' in field ? !field.isDeprecated : true,
      );
      if (deprecatedFields.length > 0) {
        deprecatedFieldsDef = (
          <div className="doc-category">
            <div className="doc-category-title">{'deprecated fields'}</div>
            {!this.state.showDeprecated ? (
              <button className="show-btn" onClick={this.handleShowDeprecated}>
                {'Show deprecated fields...'}
              </button>
            ) : (
              deprecatedFields.map(field => (
                <Field
                  key={field.name}
                  type={type}
                  field={field}
                  onClickType={onClickType}
                  onClickField={onClickField}
                />
              ))
            )}
          </div>
        );
      }
    }

    let valuesDef: ReactNode;
    let deprecatedValuesDef: ReactNode;
    if (type instanceof GraphQLEnumType) {
      const values = type.getValues();
      valuesDef = (
        <div className="doc-category">
          <div className="doc-category-title">{'values'}</div>
          {values
            .filter(value => !value.isDeprecated)
            .map(value => (
              <EnumValue key={value.name} value={value} />
            ))}
        </div>
      );

      const deprecatedValues = values.filter(value => value.isDeprecated);
      if (deprecatedValues.length > 0) {
        deprecatedValuesDef = (
          <div className="doc-category">
            <div className="doc-category-title">{'deprecated values'}</div>
            {!this.state.showDeprecated ? (
              <button className="show-btn" onClick={this.handleShowDeprecated}>
                {'Show deprecated values...'}
              </button>
            ) : (
              deprecatedValues.map(value => (
                <EnumValue key={value.name} value={value} />
              ))
            )}
          </div>
        );
      }
    }

    return (
      <div>
        <MarkdownContent
          className="doc-type-description"
          markdown={
            ('description' in type && type.description) || 'No Description'
          }
        />
        {type instanceof GraphQLObjectType && typesDef}
        {fieldsDef}
        {deprecatedFieldsDef}
        {valuesDef}
        {deprecatedValuesDef}
        {!(type instanceof GraphQLObjectType) && typesDef}
      </div>
    );
  }

  handleShowDeprecated = () => this.setState({ showDeprecated: true });
}

type FieldProps = {
  type: GraphQLType;
  field: GraphQLField | GraphQLInputField;
  onClickType: () => void;
  onClickField: () => void;
};

function Field({ type, field, onClickType, onClickField }: FieldProps) {
  return (
    <div className="doc-category-item">
      <a
        className="field-name"
        onClick={event => onClickField(field, type, event)}>
        {field.name}
      </a>
      {field.args &&
        field.args.length > 0 && [
          '(',
          <span key="args">
            {field.args.map(arg => (
              <Argument key={arg.name} arg={arg} onClickType={onClickType} />
            ))}
          </span>,
          ')',
        ]}
      {': '}
      <TypeLink type={field.type} onClick={onClickType} />
      <DefaultValue field={field} />
      {field.description && (
        <MarkdownContent
          className="field-short-description"
          markdown={field.description}
        />
      )}
      {field.deprecationReason && (
        <MarkdownContent
          className="doc-deprecation"
          markdown={field.deprecationReason}
        />
      )}
    </div>
  );
}

type EnumValue = {
  value: GraphQLEnumValue;
};

function EnumValue({ value }: EnumValue) {
  return (
    <div className="doc-category-item">
      <div className="enum-value">{value.name}</div>
      <MarkdownContent
        className="doc-value-description"
        markdown={value.description}
      />
      {value.deprecationReason && (
        <MarkdownContent
          className="doc-deprecation"
          markdown={value.deprecationReason}
        />
      )}
    </div>
  );
}
