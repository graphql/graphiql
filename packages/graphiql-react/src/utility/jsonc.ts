import {
  parse as jsoncParse,
  ParseError,
  printParseErrorCode,
} from 'jsonc-parser';

export async function formatJSONC(content: string): Promise<string> {
  // We don't need to load Prettier initially; it's only used when the 'Format Query' button or shortcut is triggered
  const [prettier, { printers }, { parsers }] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/estree'),
    import('prettier/parser-babel'),
  ]);

  return prettier.format(content, {
    parser: 'jsonc',
    plugins: [
      // Fix: Couldn't find plugin for AST format "estree"
      { printers },
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

// Plain-language descriptions for `jsonc-parser` error codes, keyed by the
// name `printParseErrorCode` returns, so they can be shown to users directly.
const PARSE_ERROR_MESSAGES: Record<string, string> = {
  InvalidSymbol: 'invalid symbol',
  InvalidNumberFormat: 'invalid number format',
  PropertyNameExpected: 'expected a property name',
  ValueExpected: 'expected a value',
  ColonExpected: 'expected a colon',
  CommaExpected: 'expected a comma',
  CloseBraceExpected: 'expected a closing brace',
  CloseBracketExpected: 'expected a closing bracket',
  EndOfFileExpected: 'expected end of file',
  InvalidCommentToken: 'invalid comment token',
  UnexpectedEndOfComment: 'unexpected end of comment',
  UnexpectedEndOfString: 'unexpected end of string',
  UnexpectedEndOfNumber: 'unexpected end of number',
  InvalidUnicode: 'invalid unicode',
  InvalidEscapeCharacter: 'invalid escape character',
  InvalidCharacter: 'invalid character',
};

function getLineAndColumn(content: string, offset: number) {
  const before = content.slice(0, offset);
  const lineStart = before.lastIndexOf('\n') + 1;
  return {
    line: before.split('\n').length,
    column: offset - lineStart + 1,
  };
}

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
      errors.map(({ error, offset }) => {
        const code = printParseErrorCode(error);
        const { line, column } = getLineAndColumn(content, offset);
        return `${PARSE_ERROR_MESSAGES[code] ?? code} at line ${line}, column ${column}`;
      }),
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
