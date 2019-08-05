/* @flow */
/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { GraphQLList, GraphQLNonNull } from 'graphql';
import CodeMirror from 'codemirror';

import getTypeInfo from './utils/getTypeInfo';
import {
  getArgumentReference,
  getDirectiveReference,
  getEnumValueReference,
  getFieldReference,
  getTypeReference,
} from './utils/SchemaReference';
import './utils/info-addon';

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
CodeMirror.registerHelper('info', 'graphql', (token, options) => {
  if (!options.schema || !token.state) {
    return;
  }

  const state = token.state;
  const kind = state.kind;
  const step = state.step;
  const typeInfo = getTypeInfo(options.schema, token.state);

  // Given a Schema and a Token, produce the contents of an info tooltip.
  // To do this, create a div element that we will render "into" and then pass
  // it to various rendering functions.
  if (
    (kind === 'Field' && step === 0 && typeInfo.fieldDef) ||
    (kind === 'AliasedField' && step === 2 && typeInfo.fieldDef)
  ) {
    const into = document.createElement('div');
    renderField(into, typeInfo, options);
    renderDescription(into, options, typeInfo.fieldDef);
    return into;
  } else if (kind === 'Directive' && step === 1 && typeInfo.directiveDef) {
    const into = document.createElement('div');
    renderDirective(into, typeInfo, options);
    renderDescription(into, options, typeInfo.directiveDef);
    return into;
  } else if (kind === 'Argument' && step === 0 && typeInfo.argDef) {
    const into = document.createElement('div');
    renderArg(into, typeInfo, options);
    renderDescription(into, options, typeInfo.argDef);
    return into;
  } else if (
    kind === 'EnumValue' &&
    typeInfo.enumValue &&
    typeInfo.enumValue.description
  ) {
    const into = document.createElement('div');
    renderEnumValue(into, typeInfo, options);
    renderDescription(into, options, typeInfo.enumValue);
    return into;
  } else if (
    kind === 'NamedType' &&
    typeInfo.type &&
    typeInfo.type.description
  ) {
    const into = document.createElement('div');
    renderType(into, typeInfo, options, typeInfo.type);
    renderDescription(into, options, typeInfo.type);
    return into;
  }
});

function renderField(into, typeInfo, options) {
  renderQualifiedField(into, typeInfo, options);
  renderTypeAnnotation(into, typeInfo, options, typeInfo.type);
}

function renderQualifiedField(into, typeInfo, options) {
  const fieldName = typeInfo.fieldDef.name;
  if (fieldName.slice(0, 2) !== '__') {
    renderType(into, typeInfo, options, typeInfo.parentType);
    text(into, '.');
  }
  text(into, fieldName, 'field-name', options, getFieldReference(typeInfo));
}

function renderDirective(into, typeInfo, options) {
  const name = '@' + typeInfo.directiveDef.name;
  text(into, name, 'directive-name', options, getDirectiveReference(typeInfo));
}

function renderArg(into, typeInfo, options) {
  if (typeInfo.directiveDef) {
    renderDirective(into, typeInfo, options);
  } else if (typeInfo.fieldDef) {
    renderQualifiedField(into, typeInfo, options);
  }

  const name = typeInfo.argDef.name;
  text(into, '(');
  text(into, name, 'arg-name', options, getArgumentReference(typeInfo));
  renderTypeAnnotation(into, typeInfo, options, typeInfo.inputType);
  text(into, ')');
}

function renderTypeAnnotation(into, typeInfo, options, t) {
  text(into, ': ');
  renderType(into, typeInfo, options, t);
}

function renderEnumValue(into, typeInfo, options) {
  const name = typeInfo.enumValue.name;
  renderType(into, typeInfo, options, typeInfo.inputType);
  text(into, '.');
  text(into, name, 'enum-value', options, getEnumValueReference(typeInfo));
}

function renderType(into, typeInfo, options, t) {
  if (t instanceof GraphQLNonNull) {
    renderType(into, typeInfo, options, t.ofType);
    text(into, '!');
  } else if (t instanceof GraphQLList) {
    text(into, '[');
    renderType(into, typeInfo, options, t.ofType);
    text(into, ']');
  } else {
    text(into, t.name, 'type-name', options, getTypeReference(typeInfo, t));
  }
}

function renderDescription(into, options, def) {
  const description = def.description;
  if (description) {
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'info-description';
    if (options.renderDescription) {
      descriptionDiv.innerHTML = options.renderDescription(description);
    } else {
      descriptionDiv.appendChild(document.createTextNode(description));
    }
    into.appendChild(descriptionDiv);
  }

  renderDeprecation(into, options, def);
}

function renderDeprecation(into, options, def) {
  const reason = def.deprecationReason;
  if (reason) {
    const deprecationDiv = document.createElement('div');
    deprecationDiv.className = 'info-deprecation';
    if (options.renderDescription) {
      deprecationDiv.innerHTML = options.renderDescription(reason);
    } else {
      deprecationDiv.appendChild(document.createTextNode(reason));
    }
    const label = document.createElement('span');
    label.className = 'info-deprecation-label';
    label.appendChild(document.createTextNode('Deprecated: '));
    deprecationDiv.insertBefore(label, deprecationDiv.firstChild);
    into.appendChild(deprecationDiv);
  }
}

function text(into, content, className, options = { onClick: null }, ref) {
  if (className) {
    const onClick = options.onClick;
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
    node.appendChild(document.createTextNode(content));
    into.appendChild(node);
  } else {
    into.appendChild(document.createTextNode(content));
  }
}
