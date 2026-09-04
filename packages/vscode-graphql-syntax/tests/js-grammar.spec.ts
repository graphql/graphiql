import { describe, it, expect } from 'vitest';
import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql grammar', () => {
  const scope = 'inline.graphql';

  it('should tokenize a simple typescript file', async () => {
    const result = await tokenizeFile('__fixtures__/test.ts', scope);
    expect(result).toMatchSnapshot();
  });
  it('should not tokenize multiline member calls as GraphQL', async () => {
    const result = await tokenizeFile(
      '__fixtures__/multiline-member.ts',
      'source.ts.test',
    );
    expect(
      result.some(token =>
        token.scopes.includes('meta.embedded.block.graphql'),
      ),
    ).toBe(false);
  });
  it('should tokenize a simple ecmascript file', async () => {
    const result = await tokenizeFile('__fixtures__/test.js', scope);
    expect(result).toMatchSnapshot();
  });
  it('should tokenize a simple vue sfc file', async () => {
    const result = await tokenizeFile('__fixtures__/test-sfc.vue', scope);
    expect(result).toMatchSnapshot();
  });
  it('should tokenize a simple vue sfc comp file', async () => {
    const result = await tokenizeFile('__fixtures__/test-sfc-comp.vue', scope);
    expect(result).toMatchSnapshot();
  });
  it('should tokenize a simple svelte file', async () => {
    const result = await tokenizeFile('__fixtures__/test.svelte', scope);
    expect(result).toMatchSnapshot();
  });
  it('should tokenize a simple astro file', async () => {
    const result = await tokenizeFile('__fixtures__/test.astro', scope);
    expect(result).toMatchSnapshot();
  });
});
