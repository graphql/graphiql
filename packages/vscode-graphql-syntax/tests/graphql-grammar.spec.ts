import { tokenizeFile } from './__utilities__/utilities';

describe('source.graphql grammar', () => {
  const scope = 'source.graphql';

  it('should tokenize a simple query', async () => {
    const result = await tokenizeFile('__fixtures__/query.graphql', scope);
    expect(result).toMatchSnapshot();
  });
  it('should tokenize an advanced query', async () => {
    const result = await tokenizeFile(
      '__fixtures__/kitchen-sink.graphql',
      scope,
    );
    expect(result).toMatchSnapshot();
  });
  it('should tokenize an advanced schema', async () => {
    const result = await tokenizeFile(
      '__fixtures__/StarWarsSchema.graphql',
      scope,
    );
    expect(result).toMatchSnapshot();
  });
});
