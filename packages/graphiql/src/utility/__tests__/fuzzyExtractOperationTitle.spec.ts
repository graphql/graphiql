import { fuzzyExtractOperationTitle } from '../fuzzyExtractOperationTitle'

describe('fuzzyExtractionOperationTitle', () =>{
    it('should extract query names', () =>{
        expect(fuzzyExtractOperationTitle(' query MyExampleQuery() {}')).toEqual('MyExampleQuery')
    })
    it('should extract query names with special characters', () =>{
        expect(fuzzyExtractOperationTitle(' query My_ExampleQuery() {}')).toEqual('My_ExampleQuery')
    })
    it('should extract query names with numbers', () =>{
        expect(fuzzyExtractOperationTitle(' query My_3xampleQuery() {}')).toEqual('My_3xampleQuery')
    })
    it('should extract mutation names with numbers', () =>{
        expect(fuzzyExtractOperationTitle(' mutation My_3xampleQuery() {}')).toEqual('My_3xampleQuery')
    })
    it('should return null for anonymous queries', () =>{
        expect(fuzzyExtractOperationTitle('{}')).toEqual('<untitled>')
    })
})
