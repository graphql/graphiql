import {
  createTab,
  fuzzyExtractOperationName,
  getDefaultTabState,
} from '../tabs';

describe('createTab', () => {
  it('creates with default title', () => {
    expect(createTab({})).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        hash: expect.any(String),
        title: '<untitled>',
      }),
    );
  });

  it('creates with title from query', () => {
    expect(createTab({ query: 'query Foo {}' })).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        hash: expect.any(String),
        title: 'Foo',
      }),
    );
  });
});

describe('fuzzyExtractionOperationTitle', () => {
  describe('without prefix', () => {
    it('should extract query names', () => {
      expect(fuzzyExtractOperationName('query MyExampleQuery() {}')).toEqual(
        'MyExampleQuery',
      );
    });
    it('should extract query names with special characters', () => {
      expect(fuzzyExtractOperationName('query My_ExampleQuery() {}')).toEqual(
        'My_ExampleQuery',
      );
    });
    it('should extract query names with numbers', () => {
      expect(fuzzyExtractOperationName('query My_3ExampleQuery() {}')).toEqual(
        'My_3ExampleQuery',
      );
    });
    it('should extract mutation names with numbers', () => {
      expect(
        fuzzyExtractOperationName('mutation My_3ExampleQuery() {}'),
      ).toEqual('My_3ExampleQuery');
    });
  });
  describe('with space prefix', () => {
    it('should extract query names', () => {
      expect(fuzzyExtractOperationName(' query MyExampleQuery() {}')).toEqual(
        'MyExampleQuery',
      );
    });
    it('should extract query names with special characters', () => {
      expect(fuzzyExtractOperationName(' query My_ExampleQuery() {}')).toEqual(
        'My_ExampleQuery',
      );
    });
    it('should extract query names with numbers', () => {
      expect(fuzzyExtractOperationName(' query My_3ExampleQuery() {}')).toEqual(
        'My_3ExampleQuery',
      );
    });
    it('should extract mutation names with numbers', () => {
      expect(
        fuzzyExtractOperationName(' mutation My_3ExampleQuery() {}'),
      ).toEqual('My_3ExampleQuery');
    });
  });

  it('should return null for anonymous queries', () => {
    expect(fuzzyExtractOperationName('{}')).toBeNull();
  });
  it('should not extract query names with comments', () => {
    expect(
      fuzzyExtractOperationName('# query My_3ExampleQuery() {}'),
    ).toBeNull();
  });
});

describe('getDefaultTabState', () => {
  it('returns default tab', () => {
    expect(
      getDefaultTabState({
        defaultQuery: '# Default',
        headers: null,
        query: null,
        variables: null,
        storage: null,
      }),
    ).toEqual({
      activeTabIndex: 0,
      tabs: [
        expect.objectContaining({
          query: '# Default',
          title: '<untitled>',
        }),
      ],
    });
  });

  it('returns initial tabs', () => {
    expect(
      getDefaultTabState({
        defaultQuery: '# Default',
        headers: null,
        defaultTabs: [
          {
            headers: null,
            query: 'query Person { person { name } }',
            variables: '{"id":"foo"}',
          },
          {
            headers: '{"x-header":"foo"}',
            query: 'query Image { image }',
            variables: null,
          },
        ],
        query: null,
        variables: null,
        storage: null,
      }),
    ).toEqual({
      activeTabIndex: 0,
      tabs: [
        expect.objectContaining({
          query: 'query Person { person { name } }',
          title: 'Person',
          variables: '{"id":"foo"}',
        }),
        expect.objectContaining({
          headers: '{"x-header":"foo"}',
          query: 'query Image { image }',
          title: 'Image',
        }),
      ],
    });
  });
});
