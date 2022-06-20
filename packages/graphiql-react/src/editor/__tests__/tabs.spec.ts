import { fuzzyExtractOperationName } from '../tabs';

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
