/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import type {
  Expression,
  TaggedTemplateExpression,
  TemplateLiteral,
} from '@babel/types';

import { Position, Range } from 'graphql-language-service';

import { TAG_MAP } from './constants';

import type { Logger, NoopLogger } from './Logger';
import { RangeMapper } from './parsers/types';
import { parserMap } from './parsers';

type TagResult = { tag: string; template: string; range: Range };

interface TagVisitors {
  [type: string]: (node: any) => void;
}

export async function findGraphQLTags(
  text: string,
  ext: keyof typeof parserMap,
  uri: string,
  logger: Logger | NoopLogger,
): Promise<TagResult[]> {
  const result: TagResult[] = [];

  let rangeMapper = (range: Range) => range;

  const parser = parserMap[ext];
  const parserResult = await parser(text, uri, logger);
  if (!parserResult) {
    return [];
  }
  if (parserResult?.rangeMapper) {
    rangeMapper = parserResult.rangeMapper;
  }

  const { asts } = parserResult;
  if (!asts?.length) {
    return [];
  }

  const visitors = {
    CallExpression(node: Expression) {
      if (!('callee' in node)) {
        return;
      }
      const { callee } = node;

      if (
        callee.type === 'Identifier' &&
        getGraphQLTagName(callee) &&
        'arguments' in node
      ) {
        const templateLiteral = node.arguments[0];
        if (
          templateLiteral &&
          (templateLiteral.type === 'TemplateLiteral' ||
            templateLiteral.type === 'TaggedTemplateExpression')
        ) {
          // @ts-expect-error
          const parsed = parseTemplateLiteral(templateLiteral, rangeMapper);
          if (parsed) {
            result.push(parsed);
          }
        }
      }

      traverse(node, visitors);
    },
    TaggedTemplateExpression(node: TaggedTemplateExpression) {
      const tagName = getGraphQLTagName(node.tag);
      if (tagName) {
        const { loc } = node.quasi.quasis[0];

        const template =
          node.quasi.quasis.length > 1
            ? node.quasi.quasis
                .map((quasi, i) =>
                  i === node.quasi.quasis?.length - 1
                    ? quasi.value.raw
                    : getReplacementString(
                        quasi.value.raw,
                        node.quasi.quasis[i + 1].value.raw,
                      ),
                )
                .join('')
            : node.quasi.quasis[0].value.raw;
        // handle template literals with N line expressions
        if (loc && node.quasi.quasis.length > 1) {
          const last = node.quasi.quasis.pop();
          if (last?.loc?.end) {
            loc.end = last.loc.end;
          }
        }
        if (loc) {
          const range = rangeMapper(
            new Range(
              new Position(loc.start.line - 1, loc.start.column),
              new Position(loc.end.line - 1, loc.end.column),
            ),
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
    TemplateLiteral(node: TemplateLiteral) {
      // check if the template literal is prefixed with #graphql
      const hasGraphQLPrefix =
        node.quasis[0].value.raw.startsWith('#graphql\n');
      // check if the template expression has /* GraphQL */ comment
      const hasGraphQLComment = Boolean(
        node.leadingComments?.[0]?.value.match(/^\s*GraphQL\s*$/),
      );
      if (hasGraphQLPrefix || hasGraphQLComment) {
        const parsed = parseTemplateLiteral(node, rangeMapper);
        if (parsed) {
          result.push(parsed);
        }
      }
    },
  };
  for (const ast of asts) {
    visit(ast, visitors);
  }
  return result;
}

/*
 Here we inject replacements for template tag literal expressions, 
 so that graphql parse & thus validation can be performed, 
 and we don't get <EOF> or expected name parse errors
 
 TODO: other user reported cases to consider:
 1. operation field argument values - though we recommend graphql variables
 2. fragment spreads (maybe fragment variables will help solve this?)
 
 these might be extra difficult because they may require type introspection
 3. directive argument default values
 5. default argument values for input types
*/
const getReplacementString = (quasi: string, nextQuasi: string) => {
  const trimmed = quasi.trimEnd();
  const trimmedNext = nextQuasi.trimStart();
  // only actually empty leaf field expressions
  if (trimmed.endsWith('{') && trimmedNext.startsWith('}')) {
    return quasi + '__typename';
  }
  return quasi;
};
/**
 * Parses a Babel AST template literal into a GraphQL tag.
 */
function parseTemplateLiteral(node: TemplateLiteral, rangeMapper: RangeMapper) {
  const { loc } = node.quasis[0];
  if (loc) {
    // handle template literals with N line expressions

    if (node.quasis.length > 1) {
      const quasis = [...node.quasis];
      const last = quasis.pop();
      if (last?.loc?.end) {
        loc.end = last.loc.end;
      }
    }
    const template = node.quasis
      .map((quasi, i) =>
        i === node.quasis?.length - 1
          ? quasi.value.raw
          : getReplacementString(quasi.value.raw, node.quasis[i + 1].value.raw),
      )
      .join('');

    const range = rangeMapper(
      new Range(
        new Position(loc.start.line - 1, loc.start.column),
        new Position(loc.end.line - 1, loc.end.column),
      ),
    );

    return {
      tag: '',
      template,
      range,
    };
  }
}

function getGraphQLTagName(tag: Expression): string | null {
  if (tag.type === 'Identifier' && TAG_MAP[tag.name]) {
    return tag.name;
  }
  if (
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

function traverse(node: { [key: string]: any }, visitors: TagVisitors) {
  for (const key in node) {
    if (IGNORED_KEYS[key]) {
      continue;
    }
    const prop = node[key];
    if (prop && typeof prop === 'object' && typeof prop.type === 'string') {
      visit(prop, visitors);
    } else if (Array.isArray(prop)) {
      for (const item of prop) {
        if (item && typeof item === 'object' && typeof item.type === 'string') {
          visit(item, visitors);
        }
      }
    }
  }
}
