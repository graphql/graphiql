import { act } from 'react';
import { StorageAPI } from '@graphiql/toolkit';
import {
  createTab,
  fuzzyExtractOperationName,
  getDefaultTabState,
  clearHeadersFromTabs,
  STORAGE_KEY,
} from '../tabs';
import { storageStore } from '../../storage';

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

  describe('comment line handling', () => {
    it('should not extract query names within commented out lines', () => {
      expect(
        fuzzyExtractOperationName('# query My_3ExampleQuery() {}'),
      ).toBeNull();
    });
    it('should extract query names when there is a single leading comment line', () => {
      expect(
        fuzzyExtractOperationName(
          '# comment line 1 \n query MyExampleQueryWithSingleCommentLine() {}',
        ),
      ).toEqual('MyExampleQueryWithSingleCommentLine');
    });
    it('should extract query names when there are more than one leading comment lines', () => {
      expect(
        fuzzyExtractOperationName(
          '# comment line 1 \n # comment line 2 \n query MyExampleQueryWithMultipleCommentLines() {}',
        ),
      ).toEqual('MyExampleQueryWithMultipleCommentLines');
    });
  });
});

describe('getDefaultTabState', () => {
  beforeEach(() => {
    act(() => {
      storageStore.setState({ storage: new StorageAPI() });
    });
  });

  it('returns default tab', () => {
    expect(
      getDefaultTabState({
        defaultQuery: '# Default',
        headers: null,
        query: null,
        variables: null,
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

describe('clearHeadersFromTabs', () => {
  it('preserves tab state except for headers', () => {
    const { storage } = storageStore.getState();
    const stateWithHeaders = {
      operationName: 'test',
      query: 'query test {\n  test {\n    id\n  }\n}',
      test: {
        a: 'test',
      },
      headers: '{ "authorization": "secret" }',
    };
    storage.set(STORAGE_KEY, JSON.stringify(stateWithHeaders));
    clearHeadersFromTabs();

    expect(JSON.parse(storage.get(STORAGE_KEY)!)).toEqual({
      ...stateWithHeaders,
      headers: null,
    });
  });
});
