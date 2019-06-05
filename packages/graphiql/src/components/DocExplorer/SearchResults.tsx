/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from "react";
import { GraphQLSchema, GraphQLType } from 'graphql'
import Argument from "./Argument";
import TypeLink from "./TypeLink";

type SearchResultsProps = {
  schema?: GraphQLSchema,
  withinType?: GraphQLType,
  searchValue?: string,
  onClickType?: (...args: any[]) => any,
  onClickField?: (...args: any[]) => any
};

export default class SearchResults extends React.Component<
  SearchResultsProps,
  {}
> {
  shouldComponentUpdate(nextProps) {
    return (
      this.props.schema !== nextProps.schema ||
      this.props.searchValue !== nextProps.searchValue
    );
  }
  render() {
    const searchValue = this.props.searchValue;
    const withinType = this.props.withinType;
    const schema = this.props.schema;
    const onClickType = this.props.onClickType;
    const onClickField = this.props.onClickField;
    const matchedWithin = [];
    const matchedTypes = [];
    const matchedFields = [];
    const typeMap = schema.getTypeMap();
    let typeNames = Object.keys(typeMap);
    // Move the within type name to be the first searched.
    if (withinType) {
      typeNames = typeNames.filter(n => n !== withinType.name);
      typeNames.unshift(withinType.name);
    }
    for (const typeName of typeNames) {
      if (
        matchedWithin.length + matchedTypes.length + matchedFields.length >=
        100
      ) {
        break;
      }
      const type = typeMap[typeName];
      if (withinType !== type && isMatch(typeName, searchValue)) {
        matchedTypes.push(
          <div className="doc-category-item" key={typeName}>
            <TypeLink type={type} onClick={onClickType} />
          </div>
        );
      }
      if (type.getFields) {
        const fields = type.getFields();
        Object.keys(fields).forEach(fieldName => {
          const field = fields[fieldName];
          let matchingArgs;
          if (!isMatch(fieldName, searchValue)) {
            if (field.args && field.args.length) {
              matchingArgs = field.args.filter(arg =>
                isMatch(arg.name, searchValue)
              );
              if (matchingArgs.length === 0) {
                return;
              }
            } else {
              return;
            }
          }
          const match = (
            <div className="doc-category-item" key={typeName + "." + fieldName}>
              {withinType !== type && [
                <TypeLink key="type" type={type} onClick={onClickType} />,
                "."
              ]}
              <a
                className="field-name"
                onClick={event => onClickField(field, type, event)}
              >
                {field.name}
              </a>
              {matchingArgs && [
                "(",
                <span key="args">
                  {matchingArgs.map(arg => (
                    <Argument
                      key={arg.name}
                      arg={arg}
                      onClickType={onClickType}
                      showDefaultValue={false}
                    />
                  ))}
                </span>,
                ")"
              ]}
            </div>
          );
          if (withinType === type) {
            matchedWithin.push(match);
          } else {
            matchedFields.push(match);
          }
        });
      }
    }
    if (
      matchedWithin.length + matchedTypes.length + matchedFields.length ===
      0
    ) {
<<<<<<< HEAD:packages/graphiql/src/components/DocExplorer/SearchResults.js
      return <span className="doc-alert-text">{'No results found.'}</span>;
=======
      return <span className="doc-alert-text">{"No results found."}</span>;
>>>>>>> c8c4756... begin graphiql typescript conversion:packages/graphiql/src/components/DocExplorer/SearchResults.tsx
    }
    if (withinType && matchedTypes.length + matchedFields.length > 0) {
      return (
        <div>
          {matchedWithin}
          <div className="doc-category">
<<<<<<< HEAD:packages/graphiql/src/components/DocExplorer/SearchResults.js
            <div className="doc-category-title">{'other results'}</div>
=======
            <div className="doc-category-title">{"other results"}</div>
>>>>>>> c8c4756... begin graphiql typescript conversion:packages/graphiql/src/components/DocExplorer/SearchResults.tsx
            {matchedTypes}
            {matchedFields}
          </div>
        </div>
      );
    }
    return (
      <div>
        {matchedWithin}
        {matchedTypes}
        {matchedFields}
      </div>
    );
  }
}
function isMatch(sourceText, searchValue) {
  try {
    const escaped = searchValue.replace(/[^_0-9A-Za-z]/g, ch => "\\" + ch);
    return sourceText.search(new RegExp(escaped, "i")) !== -1;
  } catch (e) {
    return sourceText.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
  }
}
