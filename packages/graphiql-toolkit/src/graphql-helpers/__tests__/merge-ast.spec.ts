import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  parse,
  print,
} from 'graphql';

import { mergeAst } from '../merge-ast';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Test',
    fields: {
      id: {
        type: GraphQLInt,
      },
    },
  }),
});

describe('MergeAst', () => {
  it('does not modify query with no fragments', () => {
    const query = `
      query Test {
        id
      }`;
    const mergedQuery = stripWhitespace(`
      query Test {
        id
      }`);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQuery);
  });

  it('does inline simple nested fragment', () => {
    const query = `
      query Test {
        ...Fragment1
      }
      
      fragment Fragment1 on Test {
        id
      }`;
    const mergedQuery = stripWhitespace(`
      query Test {
        ...on Test {
          id
        }
      }`);
    const mergedQueryWithSchema = stripWhitespace(`
      query Test {
        id
      }`);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('does inline triple nested fragment', () => {
    const query = `
      query Test {
        ...Fragment1
      }
      
      fragment Fragment1 on Test {
        ...Fragment2
      }
      
      fragment Fragment2 on Test {
        ...Fragment3
      }
      
      fragment Fragment3 on Test {
        id
      }`;
    const mergedQuery = stripWhitespace(`
      query Test {
        ...on Test {
          ...on Test {
            ...on Test {
              id
            }
          }
        }
      }`);
    const mergedQueryWithSchema = stripWhitespace(`
      query Test {
        id
      }`);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('does inline multiple fragments', () => {
    const query = `
      query Test {
        ...Fragment1
        ...Fragment2
        ...Fragment3
      }
      
      fragment Fragment1 on Test {
        id
      }
      
      fragment Fragment2 on Test {
        id
      }
      
      fragment Fragment3 on Test {
        id
      }`;
    const mergedQuery = stripWhitespace(`
      query Test {
        ...on Test {
          id
        }
        ...on Test {
          id
        }
        ...on Test {
          id
        }
      }`);
    const mergedQueryWithSchema = stripWhitespace(`
      query Test {
        id
      }`);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('removes duplicate fragment spreads', () => {
    const query = `
      query Test {
        ...Fragment1
        ...Fragment1
      }
      
      fragment Fragment1 on Test {
        id
      }`;
    const mergedQuery = stripWhitespace(`
      query Test {
        ...on Test {
          id
        }
      }`);
    const mergedQueryWithSchema = stripWhitespace(`
      query Test {
        id
      }`);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });
});

function parseMergeAndPrint(query: string, maybeSchema?: GraphQLSchema) {
  return stripWhitespace(print(mergeAst(parse(query), maybeSchema)));
}

function stripWhitespace(str: string) {
  return str.replace(/\s/g, '');
}
