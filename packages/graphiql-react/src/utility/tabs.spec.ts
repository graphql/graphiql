import { describe, it, expect } from 'vitest';
import { StorageAPI } from '@graphiql/toolkit';
import {
  createTab,
  fuzzyExtractOperationName,
  getDefaultTabState,
  clearHeadersFromTabs,
  serializeTabState,
} from './tabs';
import { STORAGE_KEY } from '../constants';

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
  it('returns default tab', () => {
    expect(
      getDefaultTabState({
        defaultQuery: '# Default',
        headers: null,
        query: null,
        variables: null,
        storage: new StorageAPI(),
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

  it('does not create an extra tab on reload when no editor state was stored', () => {
    const storage = new StorageAPI();
    // First visit: no storage at all, so the default tab is created…
    const initial = getDefaultTabState({
      defaultQuery: '# Default',
      headers: null,
      query: null,
      variables: null,
      storage,
    });
    // …and persisted, while the query/variables/headers storage keys are
    // only written on edit, so they remain empty.
    storage.set(STORAGE_KEY.tabs, serializeTabState(initial));

    const reloaded = getDefaultTabState({
      defaultQuery: '# Default',
      headers: null,
      query: null,
      variables: null,
      storage,
    });
    storage.clear();
    expect(reloaded.tabs).toHaveLength(1);
    expect(reloaded.activeTabIndex).toBe(0);
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
        storage: new StorageAPI(),
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
    const storage = new StorageAPI();
    const stateWithHeaders = {
      operationName: 'test',
      query: 'query test {\n  test {\n    id\n  }\n}',
      test: {
        a: 'test',
      },
      headers: '{ "authorization": "secret" }',
    };
    storage.set(STORAGE_KEY.tabs, JSON.stringify(stateWithHeaders));
    clearHeadersFromTabs(storage);

    expect(JSON.parse(storage.get(STORAGE_KEY.tabs)!)).toEqual({
      ...stateWithHeaders,
      headers: null,
    });
  });
});
