import prettier from 'prettier/standalone';
// @ts-expect-error -- wrong types
import { printers } from 'prettier/plugins/estree';
import { parsers } from 'prettier/parser-babel';
import {
  parse as jsoncParse,
  ParseError,
  printParseErrorCode,
} from 'jsonc-parser';

export function formatJSONC(content: string) {
  return prettier.format(content, {
    parser: 'jsonc',
    plugins: [
      // Fixes ConfigError: Couldn't find plugin for AST format "estree"
      { printers },
      // @ts-expect-error -- Fixes ConfigError: Couldn't resolve parser "jsonc"
      { parsers },
    ],
    // always split into new lines, e.g. {"foo":true} => {\n  "foo": true\n}
    printWidth: 0,
  });
}

const formatter = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction', // uses "and"
});

export function parseJSONC(content: string) {
  const errors: ParseError[] = [];

  const parsed: undefined | Record<string, unknown> = jsoncParse(
    content,
    errors,
    {
      allowTrailingComma: true,
      allowEmptyContent: true,
    },
  );
  if (errors.length) {
    const output = formatter.format(
      errors.map(({ error }) => printParseErrorCode(error)),
    );
    throw new SyntaxError(output);
  }
  return parsed;
}

export function tryParseJSONC(json = '') {
  let parsed: Record<string, unknown> | undefined;
  try {
    parsed = parseJSONC(json);
  } catch (error) {
    throw new Error(
      `are invalid JSON: ${error instanceof Error ? error.message : error}.`,
    );
  }
  if (!parsed) {
    return;
  }
  const isObject = typeof parsed === 'object' && !Array.isArray(parsed);
  if (!isObject) {
    throw new TypeError('are not a JSON object.');
  }
  return parsed;
}
