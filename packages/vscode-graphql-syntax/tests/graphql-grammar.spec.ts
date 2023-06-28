import { describe, it, expect } from 'vitest';
import { tokenizeFile } from './utilities';

describe('source.graphql grammar', () => {
  const scope = 'source.graphql';

  it('should tokenize a simple query', async () => {
    const result = await tokenizeFile('fixtures/query.graphql', scope);
    expect(result).toMatchSnapshot();
  });
});
