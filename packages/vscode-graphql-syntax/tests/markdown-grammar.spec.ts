import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.markdown.codeblock grammar', () => {
  const scope = 'inline.graphql.markdown.codeblock';

  it('should tokenize a simple markdown file', async () => {
    const result = await tokenizeFile('__fixtures__/test.md', scope);
    expect(result).toMatchSnapshot();
  });
});
