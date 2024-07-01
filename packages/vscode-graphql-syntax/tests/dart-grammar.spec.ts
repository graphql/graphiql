import { tokenizeFile } from './__utilities__/utilities';

describe('inline.graphql.dart grammar', () => {
  const scope = 'inline.graphql.dart';

  it('should tokenize a simple dart file', async () => {
    const result = await tokenizeFile('__fixtures__/test.dart', scope);
    expect(result).toMatchSnapshot();
  });
});
