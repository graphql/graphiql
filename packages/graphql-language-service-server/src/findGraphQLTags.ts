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
  TemplateLiteral,
} from '@babel/types';

import { Position, Range } from 'graphql-language-service';

import { parse, ParserOptions, ParserPlugin } from '@babel/parser';
import * as VueParser from '@vue/compiler-sfc';
import { Logger } from './Logger';
import { ParseDocumentOptions } from './parseDocument';

// Attempt to be as inclusive as possible of source text.
const PARSER_OPTIONS: ParserOptions = {
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  sourceType: 'module',
  strictMode: false,
};

const DEFAULT_STABLE_TAGS = ['graphql', 'graphqls', 'gql'];
export const DEFAULT_TAGS = [...DEFAULT_STABLE_TAGS, 'graphql.experimental'];

type TagResult = { tag: string; template: string; range: Range };

interface TagVisitors {
  [type: string]: (node: any) => void;
}

const BABEL_PLUGINS: ParserPlugin[] = [
  'asyncDoExpressions',
  'asyncGenerators',
  'bigInt',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'classStaticBlock',
  'doExpressions',
  'decimal',
  'destructuringPrivate',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'importAssertions',
  'jsx',
  'logicalAssignment',
  'moduleBlocks',
  'moduleStringNames',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  ['pipelineOperator', { proposal: 'minimal' }],
  'privateIn',
  'regexpUnicodeSets',
  'throwExpressions',
  'topLevelAwait',
];

type ParseVueSFCResult =
  | { type: 'error'; errors: Error[] }
  | {
      type: 'ok';
      scriptSetupAst?: import('@babel/types').Statement[];
      scriptAst?: import('@babel/types').Statement[];
    };
function parseVueSFC(source: string): ParseVueSFCResult {
  const { errors, descriptor } = VueParser.parse(source);

  if (errors.length !== 0) {
    return { type: 'error', errors };
  }

  let scriptBlock: VueParser.SFCScriptBlock | null = null;
  try {
    scriptBlock = VueParser.compileScript(descriptor, { id: 'foobar' });
  } catch (error) {
    return { type: 'error', errors: [error as Error] };
  }

  return {
    type: 'ok',
    scriptSetupAst: scriptBlock?.scriptSetupAst,
    scriptAst: scriptBlock?.scriptAst,
  };
}

export function findGraphQLTags(
  text: string,
  ext: string,
  uri: string,
  logger: Logger,
  options: ParseDocumentOptions,
): TagResult[] {
  const result: TagResult[] = [];

  const plugins = BABEL_PLUGINS.slice(0, BABEL_PLUGINS.length);

  const isVueLike = ext === '.vue' || ext === '.svelte';

  let parsedASTs: { [key: string]: any }[] = [];

  if (isVueLike) {
    const parseVueSFCResult = parseVueSFC(text);
    if (parseVueSFCResult.type === 'error') {
      logger.error(
        `Could not parse the Vue file at ${uri} to extract the graphql tags:`,
      );
      for (const error of parseVueSFCResult.errors) {
        logger.error(String(error));
      }
      return [];
    }

    if (parseVueSFCResult.scriptAst !== undefined) {
      parsedASTs.push(...parseVueSFCResult.scriptAst);
    }
    if (parseVueSFCResult.scriptSetupAst !== undefined) {
      parsedASTs.push(...parseVueSFCResult.scriptSetupAst);
    }
  } else {
    const isTypeScript = ext === '.ts' || ext === '.tsx';
    if (isTypeScript) {
      plugins?.push('typescript');
    } else {
      plugins?.push('flow', 'flowComments');
    }
    if (options?.enableLegacyDecorators) {
      plugins.push('decorators-legacy');
    } else {
      plugins.push(['decorators', { decoratorsBeforeExport: false }]);
    }

    PARSER_OPTIONS.plugins = plugins;

    try {
      parsedASTs = [parse(text, PARSER_OPTIONS)];
    } catch (error) {
      const type = isTypeScript ? 'TypeScript' : 'JavaScript';
      logger.error(
        `Could not parse the ${type} file at ${uri} to extract the graphql tags:`,
      );
      logger.error(String(error));
      return [];
    }
  }

  const asts = parsedASTs;

  const parseTemplateLiteral = (node: TemplateLiteral) => {
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
  };

  const visitors = {
    CallExpression: (node: Expression) => {
      if ('callee' in node) {
        const callee = node.callee;

        if (
          callee.type === 'Identifier' &&
          getGraphQLTagName(callee) &&
          'arguments' in node
        ) {
          const templateLiteral = node.arguments[0];
          if (templateLiteral && templateLiteral.type === 'TemplateLiteral') {
            parseTemplateLiteral(templateLiteral);
            return;
          }
        }

        traverse(node, visitors);
        return;
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
      const hasGraphQLPrefix =
        node.quasis[0].value.raw.startsWith('#graphql\n');
      const hasGraphQLComment = Boolean(
        node.leadingComments?.[0]?.value.match(/^\s*GraphQL\s*$/),
      );
      if (hasGraphQLPrefix || hasGraphQLComment) {
        parseTemplateLiteral(node);
      }
    },
  };
  for (const ast of asts) {
    visit(ast, visitors);
  }

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

function visit(node: { [key: string]: any }, visitors: TagVisitors) {
  const fn = visitors[node.type];
  if (fn && fn != null) {
    fn(node);
    return;
  }
  traverse(node, visitors);
}

function traverse(node: { [key: string]: any }, visitors: TagVisitors) {
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
