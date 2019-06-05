/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import {Position, Range} from 'graphql-language-service-utils';

import {parse} from 'babylon';

// Attempt to be as inclusive as possible of source text.
const BABYLON_OPTIONS = {
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  sourceType: 'module',
  plugins: [
    // Previously "*"
    'asyncGenerators',
    'classProperties',
    'decorators',
    'doExpressions',
    'dynamicImport',
    'exportExtensions',
    'flow',
    'functionBind',
    'functionSent',
    'jsx',
    'objectRestSpread',
  ],
  strictMode: false,
};

export function findGraphQLTags(
  text: string,
): Array<{tag: string, template: string, range: Range}> {
  const result = [];
  const ast = parse(text, BABYLON_OPTIONS);

  const visitors = {
    CallExpression: node => {
      const callee = node.callee;
      if (
        !(
          (callee.type === 'Identifier' &&
            CREATE_CONTAINER_FUNCTIONS[callee.name]) ||
          (callee.kind === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.value === 'Relay' &&
            callee.property.type === 'Identifier' &&
            CREATE_CONTAINER_FUNCTIONS[callee.property.name])
        )
      ) {
        traverse(node, visitors);
        return;
      }
      const fragments = node.arguments[1];
      if (fragments.type === 'ObjectExpression') {
        fragments.properties.forEach(property => {
          const tagName = getGraphQLTagName(property.value.tag);
          const template = getGraphQLText(property.value.quasi);
          if (tagName === 'graphql' || tagName === 'graphql.experimental') {
            const loc = property.value.loc;
            const range = new Range(
              new Position(loc.start.line - 1, loc.start.column),
              new Position(loc.end.line - 1, loc.end.column),
            );
            result.push({
              tag: tagName,
              template,
              range,
            });
          }
        });
      } else {
        const tagName = getGraphQLTagName(fragments.tag);
        const template = getGraphQLText(fragments.quasi);
        if (tagName === 'graphql' || tagName === 'graphql.experimental') {
          const loc = fragments.loc;
          const range = new Range(
            new Position(loc.start.line - 1, loc.start.column),
            new Position(loc.end.line - 1, loc.end.column),
          );
          result.push({
            tag: tagName,
            template,
            range,
          });
        }
      }

      // Visit remaining arguments
      for (let ii = 2; ii < node.arguments.length; ii++) {
        visit(node.arguments[ii], visitors);
      }
    },
    TaggedTemplateExpression: node => {
      const tagName = getGraphQLTagName(node.tag);
      if (tagName != null) {
        if (tagName === 'graphql' || tagName === 'graphql.experimental') {
          const loc = node.quasi.quasis[0].loc;
          const range = new Range(
            new Position(loc.start.line - 1, loc.start.column),
            new Position(loc.end.line - 1, loc.end.column),
          );
          result.push({
            tag: tagName,
            template: node.quasi.quasis[0].value.raw,
            range,
          });
        }
      }
    },
  };
  visit(ast, visitors);
  return result;
}

const CREATE_CONTAINER_FUNCTIONS = {
  createFragmentContainer: true,
  createPaginationContainer: true,
  createRefetchContainer: true,
};

const IDENTIFIERS = {graphql: true};

const IGNORED_KEYS = {
  comments: true,
  end: true,
  leadingComments: true,
  loc: true,
  name: true,
  start: true,
  trailingComments: true,
  type: true,
};

function getGraphQLTagName(tag) {
  if (tag.type === 'Identifier' && IDENTIFIERS.hasOwnProperty(tag.name)) {
    return tag.name;
  } else if (
    tag.type === 'MemberExpression' &&
    tag.object.type === 'Identifier' &&
    tag.object.name === 'graphql' &&
    tag.property.type === 'Identifier' &&
    tag.property.name === 'experimental'
  ) {
    return 'graphql.experimental';
  }
  return null;
}

function getGraphQLText(quasi) {
  const quasis = quasi.quasis;
  return quasis[0].value.raw;
}

function visit(node, visitors) {
  const fn = visitors[node.type];
  if (fn != null) {
    fn(node);
    return;
  }
  traverse(node, visitors);
}

function traverse(node, visitors) {
  for (const key in node) {
    if (IGNORED_KEYS[key]) {
      continue;
    }
    const prop = node[key];
    if (prop && typeof prop === 'object' && typeof prop.type === 'string') {
      visit(prop, visitors);
    } else if (Array.isArray(prop)) {
      prop.forEach(item => {
        if (item && typeof item === 'object' && typeof item.type === 'string') {
          visit(item, visitors);
        }
      });
    }
  }
}
