import { describe, it, expect } from 'vitest';
import { tokenizeFile } from './__utilities__/utilities';

describe('source.graphql grammar', () => {
  const scope = 'source.graphql';

  it('should preserve consecutive descriptions and subsequent definitions', async () => {
    const result = await tokenizeFile(
      '__fixtures__/consecutive-descriptions.graphql',
      scope,
    );
    for (const text of [
      'Second argument, with punctuation: (value)',
      'Fourth argument',
      'Fifth argument',
      'Next field',
      'Inline second',
      'Final field',
      'Input field description',
      'Directive argument description',
    ]) {
      expect(
        result.find(token => token.text.trim() === text)?.scopes,
      ).toContain('comment.line.documentation.graphql');
    }
    for (const text of [
      'Third argument',
      'Block input description',
      'After directive without arguments',
      'After directive with arguments',
      'After directive with block string',
    ]) {
      expect(
        result.find(token => token.text.trim() === text)?.scopes,
      ).toContain('comment.block.documentation.graphql');
    }
    for (const text of ['default value', 'input default', 'use user']) {
      expect(result.find(token => token.text === text)?.scopes).toContain(
        'string.quoted.double.graphql',
      );
    }
    for (const text of ['block default', 'block directive argument']) {
      expect(
        result.find(token => token.text.trim() === text)?.scopes,
      ).toContain('string.quoted.triple.graphql');
    }
    expect(result.find(token => token.text === 'final')?.scopes).toContain(
      'variable.graphql',
    );
    expect(result).toMatchSnapshot();
  });

  it('should separate defaults from following descriptions', async () => {
    const result = await tokenizeFile(
      '__fixtures__/default-description-boundaries.txt',
      scope,
    );
    for (const text of [
      'compact input default',
      'first input default',
      'compact argument default',
      'first argument default',
    ]) {
      expect(result.find(token => token.text === text)?.scopes).toContain(
        'string.quoted.double.graphql',
      );
    }
    for (const text of [
      'compact input block default',
      'third input default',
      'compact argument block default',
      'third argument default',
    ]) {
      expect(result.find(token => token.text === text)?.scopes).toContain(
        'string.quoted.triple.graphql',
      );
    }
    for (const text of [
      'Single-line input description',
      'After input list default',
      'After input object default',
      'Single-line argument description',
      'After argument list default',
      'After argument object default',
    ]) {
      expect(result.find(token => token.text === text)?.scopes).toContain(
        'comment.line.documentation.graphql',
      );
    }
    for (const text of [
      'Block input description',
      'Block argument description',
    ]) {
      expect(result.find(token => token.text === text)?.scopes).toContain(
        'comment.block.documentation.graphql',
      );
    }
  });

  it('should tokenize a simple query', async () => {
    const result = await tokenizeFile('__fixtures__/query.graphql', scope);
    expect(result).toMatchSnapshot();
  });
  it('should tokenize an advanced query', async () => {
    const result = await tokenizeFile(
      '__fixtures__/kitchen-sink.graphql',
      scope,
    );
    expect(result).toMatchSnapshot();
  });
  it('should tokenize an advanced schema', async () => {
    const result = await tokenizeFile(
      '__fixtures__/StarWarsSchema.graphql',
      scope,
    );
    expect(result).toMatchSnapshot();
  });
  it('should tokenize descriptions as documentation and argument values as strings', async () => {
    const result = await tokenizeFile(
      '__fixtures__/descriptions-and-values.graphql',
      scope,
    );
    expect(result).toMatchSnapshot();
  });
});
