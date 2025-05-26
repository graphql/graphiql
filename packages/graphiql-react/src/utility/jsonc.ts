import prettier from 'prettier/standalone';
// @ts-expect-error -- wrong types
import { printers } from 'prettier/plugins/estree';
import { parsers as parsersBabel } from 'prettier/parser-babel';
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
      { parsers: parsersBabel },
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

  const parsed = content.trim() && jsoncParse(content, errors);

  if (errors.length) {
    const output = formatter.format(
      errors.map(({ error }) => printParseErrorCode(error)),
    );
    throw new SyntaxError(output);
  }
  return parsed;
}
