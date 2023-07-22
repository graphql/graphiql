import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.scala grammar', () => {
  const scope = 'inline.graphql.scala';

  it('should tokenize a simple scala file', async () => {
    const result = await tokenizeFile('__fixtures__/test.scala', scope);
    expect(result).toMatchSnapshot();
  });
});
