import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.php grammar', () => {
  const scope = 'inline.graphql.php';

  it('should tokenize a simple php file', async () => {
    const result = await tokenizeFile('__fixtures__/test.php', scope);
    expect(result).toMatchSnapshot();
  });
});
