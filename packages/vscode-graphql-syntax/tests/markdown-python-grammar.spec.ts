import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.markdown.codeblock grammar python', () => {
  const scope = 'inline.graphql.markdown.codeblock';

  it('should tokenize a markdown file with python', async () => {
    const result = await tokenizeFile('__fixtures__/test-py.md', scope);
    expect(result).toMatchSnapshot();
  });
});
