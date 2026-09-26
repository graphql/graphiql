import { describe, it, expect } from 'vitest';
import { parseJSONC, tryParseJSONC } from './jsonc';

describe('parseJSONC', () => {
  it('parses JSONC with comments and trailing commas', () => {
    expect(parseJSONC('{ "a": 1, /* comment */ "b": [1, 2,], }')).toEqual({
      a: 1,
      b: [1, 2],
    });
  });

  it('returns undefined for empty content', () => {
    expect(parseJSONC('')).toBeUndefined();
  });

  it('reports a plain-language message with line and column', () => {
    expect(() => parseJSONC('{"id": }')).toThrow(
      'expected a value at line 1, column 8',
    );
  });

  it('does not expose the raw parser error code', () => {
    expect(() => parseJSONC('{"id": }')).not.toThrow('ValueExpected');
  });

  it('reports the correct line and column for multi-line content', () => {
    const content = ['{', '  "id": 1', '  "name": "x"', '}'].join('\n');
    // a comma is missing after `1`, so the error is on line 3 at `"name"`
    expect(() => parseJSONC(content)).toThrow(
      'expected a comma at line 3, column 3',
    );
  });

  it('lists every error when there are several', () => {
    expect(() => parseJSONC('{"a": , "b": }')).toThrow(
      'expected a value at line 1, column 7 and expected a value at line 1, column 14',
    );
  });
});

describe('tryParseJSONC', () => {
  it('prefixes parse errors so they read as a sentence', () => {
    expect(() => tryParseJSONC('{"id": }')).toThrow(
      'are invalid JSON: expected a value at line 1, column 8.',
    );
  });

  it('rejects non-object JSON', () => {
    expect(() => tryParseJSONC('[1, 2]')).toThrow('are not a JSON object.');
  });

  it('returns undefined for empty content', () => {
    expect(tryParseJSONC('')).toBeUndefined();
    expect(tryParseJSONC()).toBeUndefined();
  });
});
