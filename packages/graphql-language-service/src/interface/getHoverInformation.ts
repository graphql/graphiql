/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Ported from codemirror-graphql
 * https://github.com/graphql/blob/main/packages/codemirror-graphql/src/info.js
 */

import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLList,
  GraphQLType,
  GraphQLField,
  GraphQLFieldConfig,
} from 'graphql';
import { ContextToken } from '../parser';
import { AllTypeInfo, IPosition } from '../types';

import { Hover } from 'vscode-languageserver-types';
import { getTokenAtPosition, getTypeInfo } from './getAutocompleteSuggestions';

export type HoverConfig = { useMarkdown?: boolean };

export function getHoverInformation(
  schema: GraphQLSchema,
  queryText: string,
  cursor: IPosition,
  contextToken?: ContextToken,
  config?: HoverConfig,
): Hover['contents'] {
  const token = contextToken || getTokenAtPosition(queryText, cursor);

  if (!schema || !token || !token.state) {
    return '';
  }

  const state = token.state;
  const kind = state.kind;
  const step = state.step;
  const typeInfo = getTypeInfo(schema, token.state);
  const options = { ...config, schema };

  // Given a Schema and a Token, produce the contents of an info tooltip.
  // To do this, create a div element that we will render "into" and then pass
  // it to various rendering functions.
  if (
    (kind === 'Field' && step === 0 && typeInfo.fieldDef) ||
    (kind === 'AliasedField' && step === 2 && typeInfo.fieldDef)
  ) {
    const into: string[] = [];
    renderMdCodeStart(into, options);
    renderField(into, typeInfo, options);
    renderMdCodeEnd(into, options);
    renderDescription(into, options, typeInfo.fieldDef);
    return into.join('').trim();
  } else if (kind === 'Directive' && step === 1 && typeInfo.directiveDef) {
    const into: string[] = [];
    renderMdCodeStart(into, options);
    renderDirective(into, typeInfo, options);
    renderMdCodeEnd(into, options);
    renderDescription(into, options, typeInfo.directiveDef);
    return into.join('').trim();
  } else if (kind === 'Argument' && step === 0 && typeInfo.argDef) {
    const into: string[] = [];
    renderMdCodeStart(into, options);
    renderArg(into, typeInfo, options);
    renderMdCodeEnd(into, options);
    renderDescription(into, options, typeInfo.argDef);
    return into.join('').trim();
  } else if (
    kind === 'EnumValue' &&
    typeInfo.enumValue &&
    'description' in typeInfo.enumValue
  ) {
    const into: string[] = [];
    renderMdCodeStart(into, options);
    renderEnumValue(into, typeInfo, options);
    renderMdCodeEnd(into, options);
    renderDescription(into, options, typeInfo.enumValue);
    return into.join('').trim();
  } else if (
    kind === 'NamedType' &&
    typeInfo.type &&
    'description' in typeInfo.type
  ) {
    const into: string[] = [];
    renderMdCodeStart(into, options);
    renderType(into, typeInfo, options, typeInfo.type);
    renderMdCodeEnd(into, options);
    renderDescription(into, options, typeInfo.type);
    return into.join('').trim();
  }
  return '';
}

function renderMdCodeStart(into: string[], options: any) {
  if (options.useMarkdown) {
    text(into, '```graphql\n');
  }
}
function renderMdCodeEnd(into: string[], options: any) {
  if (options.useMarkdown) {
    text(into, '\n```');
  }
}

function renderField(into: string[], typeInfo: AllTypeInfo, options: any) {
  renderQualifiedField(into, typeInfo, options);
  renderTypeAnnotation(into, typeInfo, options, typeInfo.type as GraphQLType);
}

function renderQualifiedField(
  into: string[],
  typeInfo: AllTypeInfo,
  options: any,
) {
  if (!typeInfo.fieldDef) {
    return;
  }
  const fieldName = typeInfo.fieldDef.name as string;
  if (fieldName.slice(0, 2) !== '__') {
    renderType(into, typeInfo, options, typeInfo.parentType as GraphQLType);
    text(into, '.');
  }
  text(into, fieldName);
}

function renderDirective(into: string[], typeInfo: AllTypeInfo, _options: any) {
  if (!typeInfo.directiveDef) {
    return;
  }
  const name = '@' + typeInfo.directiveDef.name;
  text(into, name);
}

function renderArg(into: string[], typeInfo: AllTypeInfo, options: any) {
  if (typeInfo.directiveDef) {
    renderDirective(into, typeInfo, options);
  } else if (typeInfo.fieldDef) {
    renderQualifiedField(into, typeInfo, options);
  }

  if (!typeInfo.argDef) {
    return;
  }

  const name = typeInfo.argDef.name;
  text(into, '(');
  text(into, name);
  renderTypeAnnotation(
    into,
    typeInfo,
    options,
    typeInfo.inputType as GraphQLType,
  );
  text(into, ')');
}

function renderTypeAnnotation(
  into: string[],
  typeInfo: AllTypeInfo,
  options: any,
  t: GraphQLType,
) {
  text(into, ': ');
  renderType(into, typeInfo, options, t);
}

function renderEnumValue(into: string[], typeInfo: AllTypeInfo, options: any) {
  if (!typeInfo.enumValue) {
    return;
  }
  const name = typeInfo.enumValue.name;
  renderType(into, typeInfo, options, typeInfo.inputType as GraphQLType);
  text(into, '.');
  text(into, name);
}

function renderType(
  into: string[],
  typeInfo: AllTypeInfo,
  options: any,
  t: GraphQLType,
) {
  if (!t) {
    return;
  }

  if (t instanceof GraphQLNonNull) {
    renderType(into, typeInfo, options, t.ofType);
    text(into, '!');
  } else if (t instanceof GraphQLList) {
    text(into, '[');
    renderType(into, typeInfo, options, t.ofType);
    text(into, ']');
  } else {
    text(into, t.name);
  }
}

function renderDescription(
  into: string[],
  options: any,
  // TODO: Figure out the right type for this one
  def: any,
) {
  if (!def) {
    return;
  }
  const description =
    typeof def.description === 'string' ? def.description : null;
  if (description) {
    text(into, '\n\n');
    text(into, description);
  }
  renderDeprecation(into, options, def);
}

function renderDeprecation(
  into: string[],
  _options: any,
  def: GraphQLField<any, any> | GraphQLFieldConfig<any, any>,
) {
  if (!def) {
    return;
  }

  const reason = def.deprecationReason ? def.deprecationReason : null;
  if (!reason) {
    return;
  }
  text(into, '\n\n');
  text(into, 'Deprecated: ');
  text(into, reason);
}

function text(into: string[], content: string) {
  into.push(content);
}
