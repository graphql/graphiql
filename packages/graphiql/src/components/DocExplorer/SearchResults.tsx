/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { ReactNode } from 'react';

import Argument from './Argument';
import TypeLink from './TypeLink';
import { useExplorerContext, useSchemaContext } from '@graphiql/react';
import FieldLink from './FieldLink';

export default function SearchResults() {
  const { explorerNavStack } = useExplorerContext({ nonNull: true });
  const { schema } = useSchemaContext({ nonNull: true });

  const navItem = explorerNavStack[explorerNavStack.length - 1];

  if (!schema || !navItem.search) {
    return null;
  }

  const searchValue = navItem.search;
  const withinType = navItem.def;

  const matchedWithin: ReactNode[] = [];
  const matchedTypes: ReactNode[] = [];
  const matchedFields: ReactNode[] = [];

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
          <TypeLink type={type} />
        </div>,
      );
    }

    if (type && 'getFields' in type) {
      const fields = type.getFields();
      Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        let matchingArgs;

        if (!isMatch(fieldName, searchValue)) {
          if ('args' in field && field.args.length) {
            matchingArgs = field.args.filter(arg =>
              isMatch(arg.name, searchValue),
            );
            if (matchingArgs.length === 0) {
              return;
            }
          } else {
            return;
          }
        }

        const match = (
          <div className="doc-category-item" key={typeName + '.' + fieldName}>
            {withinType !== type && [<TypeLink key="type" type={type} />, '.']}
            <FieldLink field={field} />
            {matchingArgs && [
              '(',
              <span key="args">
                {matchingArgs.map(arg => (
                  <Argument key={arg.name} arg={arg} showDefaultValue={false} />
                ))}
              </span>,
              ')',
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

  if (matchedWithin.length + matchedTypes.length + matchedFields.length === 0) {
    return <span className="doc-alert-text">No results found.</span>;
  }

  if (withinType && matchedTypes.length + matchedFields.length > 0) {
    return (
      <div>
        {matchedWithin}
        <div className="doc-category">
          <div className="doc-category-title">other results</div>
          {matchedTypes}
          {matchedFields}
        </div>
      </div>
    );
  }

  return (
    <div className="doc-search-items">
      {matchedWithin}
      {matchedTypes}
      {matchedFields}
    </div>
  );
}

function isMatch(sourceText: string, searchValue: string) {
  try {
    const escaped = searchValue.replace(/[^_0-9A-Za-z]/g, ch => '\\' + ch);
    return sourceText.search(new RegExp(escaped, 'i')) !== -1;
  } catch (e) {
    return sourceText.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
  }
}
