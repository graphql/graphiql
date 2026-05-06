import { describe, it, expect } from 'vitest';
import { buildSchema } from 'graphql';
import { GraphQLWorker } from '../src/GraphQLWorker';

const schema = buildSchema(`
  type Query { hero: Hero }
  type Hero { name: String }
`);

function createWorker(document: string) {
  const uri = 'monaco://model/1';
  const ctx = {
    getMirrorModels: () => [
      {
        uri: { toString: () => uri },
        getValue: () => document,
      },
    ],
  } as any;
  const worker = new GraphQLWorker(ctx, {
    languageId: 'graphql',
    languageConfig: {
      schemas: [{ uri: 'schema.graphql', schema }],
    },
    diagnosticSettings: {},
  });
  return { worker, uri };
}

describe('GraphQLWorker.doHover', () => {
  it('returns hover info and a token range when hovering on the first line', async () => {
    const { worker, uri } = createWorker('query { hero { name } }');
    // Monaco positions are 1-indexed. Line 1 column 10 is 'e' of 'hero'.
    const result = await worker.doHover(uri, {
      lineNumber: 1,
      column: 10,
    } as any);

    expect(result).not.toBeNull();
    expect(result!.content).toContain('Query.hero');
    // 'hero' spans 0-indexed characters 8..12, monaco columns 9..13.
    expect(result!.range).toEqual({
      startLineNumber: 1,
      endLineNumber: 1,
      startColumn: 9,
      endColumn: 13,
    });
  });
});
