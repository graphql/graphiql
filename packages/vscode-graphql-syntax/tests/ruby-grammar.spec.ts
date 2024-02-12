import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.rb grammar', () => {
  const scope = 'inline.graphql.rb';

  it('should tokenize a simple ruby file', async () => {
    const result = await tokenizeFile('__fixtures__/test.rb', scope);
    expect(result).toMatchSnapshot();
  });
});
