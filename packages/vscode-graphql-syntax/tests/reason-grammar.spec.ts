import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.reason grammar', () => {
  const scope = 'inline.graphql.re';

  it('should tokenize a simple reasonML file', async () => {
    const result = await tokenizeFile('__fixtures__/test.re', scope);
    expect(result).toMatchSnapshot();
  });
});
