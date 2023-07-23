import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.python grammar', () => {
  const scope = 'inline.graphql.python';

  it('should tokenize a simple python file', async () => {
    const result = await tokenizeFile('__fixtures__/test.py', scope);
    expect(result).toMatchSnapshot();
  });
});
