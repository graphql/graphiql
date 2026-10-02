import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.hack grammar', () => {
  const scope = 'inline.graphql.hack';

  it('should tokenize a simple hack file', async () => {
    const result = await tokenizeFile('__fixtures__/test.hack', scope);
    expect(result).toMatchSnapshot();
  });
});
