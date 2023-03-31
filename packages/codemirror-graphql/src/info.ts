/* @flow */
/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLInputField,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLType,
} from 'graphql';
import CodeMirror from 'codemirror';

import getTypeInfo, { TypeInfo } from './utils/getTypeInfo';
import {
  getArgumentReference,
  getDirectiveReference,
  getEnumValueReference,
  getFieldReference,
  getTypeReference,
  SchemaReference,
} from './utils/SchemaReference';
import './utils/info-addon';
import type { Maybe } from 'graphql-language-service';

export interface GraphQLInfoOptions {
  schema?: GraphQLSchema;
  onClick?: Maybe<(ref: Maybe<SchemaReference>, e: MouseEvent) => void>;
  renderDescription?: (str: string) => string;
  render?: () => string;
}

/**
 * Registers GraphQL "info" tooltips for CodeMirror.
 *
 * When hovering over a token, this presents a tooltip explaining it.
 *
 * Options:
 *
 *   - schema: GraphQLSchema provides positionally relevant info.
 *   - hoverTime: The number of ms to wait before showing info. (Default 500)
 *   - renderDescription: Convert a description to some HTML, Useful since
 *                        descriptions are often Markdown formatted.
 *   - onClick: A function called when a named thing is clicked.
 *
 */
CodeMirror.registerHelper(
  'info',
  'graphql',
  (token: CodeMirror.Token, options: GraphQLInfoOptions) => {
    if (!options.schema || !token.state) {
      return;
    }
    const { kind, step } = token.state;
    const typeInfo = getTypeInfo(options.schema, token.state);

    // Given a Schema and a Token, produce the contents of an info tooltip.
    // To do this, create a div element that we will render "into" and then pass
    // it to various rendering functions.
    if (
      (kind === 'Field' && step === 0 && typeInfo.fieldDef) ||
      (kind === 'AliasedField' && step === 2 && typeInfo.fieldDef)
    ) {
      const header = document.createElement('div');
      header.className = 'CodeMirror-info-header';
      renderField(header, typeInfo, options);
      const into = document.createElement('div');
      into.append(header);
      renderDescription(into, options, typeInfo.fieldDef as any);
      return into;
    }
    if (kind === 'Directive' && step === 1 && typeInfo.directiveDef) {
      const header = document.createElement('div');
      header.className = 'CodeMirror-info-header';
      renderDirective(header, typeInfo, options);
      const into = document.createElement('div');
      into.append(header);
      renderDescription(into, options, typeInfo.directiveDef);
      return into;
    }
    if (kind === 'Argument' && step === 0 && typeInfo.argDef) {
      const header = document.createElement('div');
      header.className = 'CodeMirror-info-header';
      renderArg(header, typeInfo, options);
      const into = document.createElement('div');
      into.append(header);
      renderDescription(into, options, typeInfo.argDef);
      return into;
    }
    if (
      kind === 'EnumValue' &&
      typeInfo.enumValue &&
      typeInfo.enumValue.description
    ) {
      const header = document.createElement('div');
      header.className = 'CodeMirror-info-header';
      renderEnumValue(header, typeInfo, options);
      const into = document.createElement('div');
      into.append(header);
      renderDescription(into, options, typeInfo.enumValue);
      return into;
    }
    if (
      kind === 'NamedType' &&
      typeInfo.type &&
      (typeInfo.type as GraphQLObjectType).description
    ) {
      const header = document.createElement('div');
      header.className = 'CodeMirror-info-header';
      renderType(header, typeInfo, options, typeInfo.type);
      const into = document.createElement('div');
      into.append(header);
      renderDescription(into, options, typeInfo.type);
      return into;
    }
  },
);

function renderField(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
) {
  renderQualifiedField(into, typeInfo, options);
  renderTypeAnnotation(into, typeInfo, options, typeInfo.type);
}

function renderQualifiedField(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
) {
  const fieldName = typeInfo.fieldDef?.name || '';
  text(into, fieldName, 'field-name', options, getFieldReference(typeInfo));
}

function renderDirective(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
) {
  const name = '@' + (typeInfo.directiveDef?.name || '');
  text(into, name, 'directive-name', options, getDirectiveReference(typeInfo));
}

function renderArg(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
) {
  const name = typeInfo.argDef?.name || '';
  text(into, name, 'arg-name', options, getArgumentReference(typeInfo));
  renderTypeAnnotation(into, typeInfo, options, typeInfo.inputType);
}

function renderEnumValue(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
) {
  const name = typeInfo.enumValue?.name || '';
  renderType(into, typeInfo, options, typeInfo.inputType);
  text(into, '.');
  text(into, name, 'enum-value', options, getEnumValueReference(typeInfo));
}

function renderTypeAnnotation(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
  t: Maybe<GraphQLType>,
) {
  const typeSpan = document.createElement('span');
  typeSpan.className = 'type-name-pill';
  if (t instanceof GraphQLNonNull) {
    renderType(typeSpan, typeInfo, options, t.ofType);
    text(typeSpan, '!');
  } else if (t instanceof GraphQLList) {
    text(typeSpan, '[');
    renderType(typeSpan, typeInfo, options, t.ofType);
    text(typeSpan, ']');
  } else {
    text(
      typeSpan,
      t?.name || '',
      'type-name',
      options,
      getTypeReference(typeInfo, t),
    );
  }
  into.append(typeSpan);
}

function renderType(
  into: HTMLElement,
  typeInfo: TypeInfo,
  options: GraphQLInfoOptions,
  t: Maybe<GraphQLType>,
) {
  if (t instanceof GraphQLNonNull) {
    renderType(into, typeInfo, options, t.ofType);
    text(into, '!');
  } else if (t instanceof GraphQLList) {
    text(into, '[');
    renderType(into, typeInfo, options, t.ofType);
    text(into, ']');
  } else {
    text(
      into,
      t?.name || '',
      'type-name',
      options,
      getTypeReference(typeInfo, t),
    );
  }
}

function renderDescription(
  into: HTMLElement,
  options: GraphQLInfoOptions,
  def:
    | GraphQLInputField
    | GraphQLEnumType
    | GraphQLDirective
    | GraphQLEnumValue
    | GraphQLType,
) {
  const { description } = def as GraphQLInputField;
  if (description) {
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'info-description';
    if (options.renderDescription) {
      descriptionDiv.innerHTML = options.renderDescription(description);
    } else {
      descriptionDiv.append(document.createTextNode(description));
    }
    into.append(descriptionDiv);
  }

  renderDeprecation(into, options, def);
}

function renderDeprecation(
  into: HTMLElement,
  options: GraphQLInfoOptions,
  def:
    | GraphQLInputField
    | GraphQLEnumType
    | GraphQLDirective
    | GraphQLEnumValue
    | GraphQLType,
) {
  const reason = (def as GraphQLInputField).deprecationReason;
  if (reason) {
    const deprecationDiv = document.createElement('div');
    deprecationDiv.className = 'info-deprecation';
    into.append(deprecationDiv);

    const label = document.createElement('span');
    label.className = 'info-deprecation-label';
    label.append(document.createTextNode('Deprecated'));
    deprecationDiv.append(label);

    const reasonDiv = document.createElement('div');
    reasonDiv.className = 'info-deprecation-reason';
    if (options.renderDescription) {
      reasonDiv.innerHTML = options.renderDescription(reason);
    } else {
      reasonDiv.append(document.createTextNode(reason));
    }
    deprecationDiv.append(reasonDiv);
  }
}

function text(
  into: HTMLElement,
  content: string,
  className = '',
  options: GraphQLInfoOptions = { onClick: null },
  ref: Maybe<SchemaReference> = null,
) {
  if (className) {
    const { onClick } = options;
    let node;
    if (onClick) {
      node = document.createElement('a');

      // Providing a href forces proper a tag behavior, though we don't actually
      // want clicking the node to navigate anywhere.
      node.href = 'javascript:void 0'; // eslint-disable-line no-script-url
      node.addEventListener('click', (e: MouseEvent) => {
        onClick(ref, e);
      });
    } else {
      node = document.createElement('span');
    }
    node.className = className;
    node.append(document.createTextNode(content));
    into.append(node);
  } else {
    into.append(document.createTextNode(content));
  }
}
