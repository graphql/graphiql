import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  buildSchema,
  parse,
  print,
} from 'graphql';

import { mergeAst } from '../merge-ast';
import fs from 'node:fs';
import path from 'node:path';
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
    const query = /* GraphQL */ `
      query Test {
        id
      }
    `;
    const mergedQuery = stripWhitespace(/* GraphQL */ `
      query Test {
        id
      }
    `);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQuery);
  });

  it('does inline simple nested fragment', () => {
    const query = /* GraphQL */ `
      query Test {
        ...Fragment1
      }

      fragment Fragment1 on Test {
        id
      }
    `;
    const mergedQuery = stripWhitespace(/* GraphQL */ `
      query Test {
        ... on Test {
          id
        }
      }
    `);
    const mergedQueryWithSchema = stripWhitespace(/* GraphQL */ `
      query Test {
        id
      }
    `);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('does inline triple nested fragment', () => {
    const query = /* GraphQL */ `
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
      }
    `;
    const mergedQuery = stripWhitespace(/* GraphQL */ `
      query Test {
        ... on Test {
          ... on Test {
            ... on Test {
              id
            }
          }
        }
      }
    `);
    const mergedQueryWithSchema = stripWhitespace(/* GraphQL */ `
      query Test {
        id
      }
    `);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('does inline multiple fragments', () => {
    const query = /* GraphQL */ `
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
      }
    `;
    const mergedQuery = stripWhitespace(/* GraphQL */ `
      query Test {
        ... on Test {
          id
        }
        ... on Test {
          id
        }
        ... on Test {
          id
        }
      }
    `);
    const mergedQueryWithSchema = stripWhitespace(/* GraphQL */ `
      query Test {
        id
      }
    `);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('removes duplicate fragment spreads', () => {
    const query = /* GraphQL */ `
      query Test {
        ...Fragment1
        ...Fragment1
      }

      fragment Fragment1 on Test {
        id
      }
    `;
    const mergedQuery = stripWhitespace(/* GraphQL */ `
      query Test {
        ... on Test {
          id
        }
      }
    `);
    const mergedQueryWithSchema = stripWhitespace(/* GraphQL */ `
      query Test {
        id
      }
    `);
    expect(parseMergeAndPrint(query)).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, schema)).toBe(mergedQueryWithSchema);
  });

  it('handles very complex query without crashing', async () => {
    // graphQLVersion = pkg.version;
    const schemaIDL = fs.readFileSync(
      path.join(__dirname, '__schema__/sorareSchema.graphql'),
      'utf8',
    );

    const sorareSchema = buildSchema(schemaIDL);

    // graphQLVersion = pkg.version;
    const query = fs.readFileSync(
      path.join(__dirname, '__queries__/testQuery.graphql'),
      'utf8',
    );
    // graphQLVersion = pkg.version;
    const mergedQuery = stripWhitespace(
      fs.readFileSync(
        path.join(__dirname, '__queries__/mergedQuery.graphql'),
        'utf8',
      ),
    );
    // graphQLVersion = pkg.version;
    const mergedQueryWithSchema = stripWhitespace(
      fs.readFileSync(
        path.join(__dirname, '__queries__/mergedQueryWithSchema.graphql'),
        'utf8',
      ),
    );

    expect(removeParametersCommas(parseMergeAndPrint(query))).toBe(mergedQuery);
    expect(parseMergeAndPrint(query, sorareSchema)).toBe(mergedQueryWithSchema);
  });
});

function parseMergeAndPrint(query: string, maybeSchema?: GraphQLSchema) {
  return stripWhitespace(print(mergeAst(parse(query), maybeSchema)));
}

function stripWhitespace(str: string) {
  return str.replaceAll(/\s/g, '');
}

function removeParametersCommas(str: string) {
  return str.replaceAll(',', '');
}
