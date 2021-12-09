/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  Expression,
  TaggedTemplateExpression,
  ObjectExpression,
  TemplateLiteral,
} from '@babel/types';

import { Position, Range } from 'graphql-language-service-utils';

import { parse, ParserOptions, ParserPlugin } from '@babel/parser';

// Attempt to be as inclusive as possible of source text.
const PARSER_OPTIONS: ParserOptions = {
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  sourceType: 'module',
  strictMode: false,
};

const CREATE_CONTAINER_FUNCTIONS: { [key: string]: boolean } = {
  createFragmentContainer: true,
  createPaginationContainer: true,
  createRefetchContainer: true,
};

const DEFAULT_STABLE_TAGS = ['graphql', 'graphqls', 'gql'];
export const DEFAULT_TAGS = [...DEFAULT_STABLE_TAGS, 'graphql.experimental'];

type TagResult = { tag: string; template: string; range: Range };

interface TagVisitiors {
  [type: string]: (node: any) => void;
}

const BABEL_PLUGINS: ParserPlugin[] = [
  'jsx',
  'doExpressions',
  'objectRestSpread',
  ['decorators', { decoratorsBeforeExport: false }],
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'asyncGenerators',
  'functionBind',
  'functionSent',
  'dynamicImport',
  'numericSeparator',
  'optionalChaining',
  'importMeta',
  'bigInt',
  'optionalCatchBinding',
  'throwExpressions',
  ['pipelineOperator', { proposal: 'minimal' }],
  'nullishCoalescingOperator',
  'topLevelAwait',
  'logicalAssignment',
];

export function findGraphQLTags(text: string, ext: string): TagResult[] {
  const result: TagResult[] = [];

  const plugins = BABEL_PLUGINS.slice(0, BABEL_PLUGINS.length);

  if (ext === '.ts' || ext === '.tsx') {
    plugins?.push('typescript');
  } else {
    plugins?.push('flow', 'flowComments');
  }
  PARSER_OPTIONS.plugins = plugins;
  const ast = parse(text, PARSER_OPTIONS);

  const visitors = {
    CallExpression: (node: Expression) => {
      if ('callee' in node) {
        const callee = node.callee;
        if (
          !(
            (callee.type === 'Identifier' &&
              CREATE_CONTAINER_FUNCTIONS[callee.name]) ||
            (callee.type === 'MemberExpression' &&
              callee.object.type === 'Identifier' &&
              callee.object.name === 'Relay' &&
              callee.property.type === 'Identifier' &&
              CREATE_CONTAINER_FUNCTIONS[callee.property.name])
          )
        ) {
          traverse(node, visitors);
          return;
        }

        if ('arguments' in node) {
          const fragments = node.arguments[1];
          if (fragments.type === 'ObjectExpression') {
            fragments.properties.forEach(
              (property: ObjectExpression['properties'][0]) => {
                if (
                  'value' in property &&
                  'loc' in property.value &&
                  'tag' in property.value
                ) {
                  const tagName = getGraphQLTagName(property.value.tag);
                  const template = getGraphQLText(property.value.quasi);
                  if (tagName && property.value.loc) {
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
                }
              },
            );
          } else if ('tag' in fragments) {
            const tagName = getGraphQLTagName(fragments.tag);
            const template = getGraphQLText(fragments.quasi);
            if (tagName && fragments.loc) {
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
        }
      }
    },
    TaggedTemplateExpression: (node: TaggedTemplateExpression) => {
      const tagName = getGraphQLTagName(node.tag);
      if (tagName) {
        const loc = node.quasi.quasis[0].loc;
        const template =
          node.quasi.quasis.length > 1
            ? node.quasi.quasis.map(quasi => quasi.value.raw).join('')
            : node.quasi.quasis[0].value.raw;
        if (loc && node.quasi.quasis.length > 1) {
          const last = node.quasi.quasis.pop();
          if (last?.loc?.end) {
            loc.end = last.loc.end;
          }
        }
        if (loc) {
          const range = new Range(
            new Position(loc.start.line - 1, loc.start.column),
            new Position(loc.end.line - 1, loc.end.column),
          );

          result.push({
            tag: tagName,
            template: template.endsWith('\n')
              ? template.slice(0, template.length - 1)
              : template,
            range,
          });
        }
      }
    },
    TemplateLiteral: (node: TemplateLiteral) => {
      const hasGraphQLPrefix = node.quasis[0].value.raw.startsWith(
        '#graphql\n',
      );
      const hasGraphQLComment = Boolean(
        node.leadingComments?.[0]?.value.match(/^\s*GraphQL\s*$/),
      );
      if (hasGraphQLPrefix || hasGraphQLComment) {
        const loc = node.quasis[0].loc;
        if (loc) {
          if (node.quasis.length > 1) {
            const last = node.quasis.pop();
            if (last?.loc?.end) {
              loc.end = last.loc.end;
            }
          }
          const template =
            node.quasis.length > 1
              ? node.quasis.map(quasi => quasi.value.raw).join('')
              : node.quasis[0].value.raw;
          const range = new Range(
            new Position(loc.start.line - 1, loc.start.column),
            new Position(loc.end.line - 1, loc.end.column),
          );
          result.push({
            tag: '',
            template,
            range,
          });
        }
      }
    },
  };
  visit(ast, visitors);

  return result;
}

const IGNORED_KEYS: { [key: string]: boolean } = {
  comments: true,
  end: true,
  leadingComments: true,
  loc: true,
  name: true,
  start: true,
  trailingComments: true,
  type: true,
};

function getGraphQLTagName(tag: Expression): string | null {
  if (
    tag.type === 'Identifier' &&
    DEFAULT_STABLE_TAGS.some(t => t === tag.name)
  ) {
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

function getGraphQLText(quasi: TemplateLiteral) {
  const quasis = quasi.quasis;
  return quasis[0].value.raw;
}

function visit(node: { [key: string]: any }, visitors: TagVisitiors) {
  const fn = visitors[node.type];
  if (fn && fn != null) {
    fn(node);
    return;
  }
  traverse(node, visitors);
}

function traverse(node: { [key: string]: any }, visitors: TagVisitiors) {
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
