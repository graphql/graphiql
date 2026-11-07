import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadConfig } from 'graphql-config';
import { expect, it } from 'vitest';
import { GraphQLCache } from '../GraphQLCache';
import { NoopLogger } from '../Logger';
import { parseDocument } from '../parseDocument';

it('discovers nested GraphQL documents with brace patterns while excluding generated and dependency files', async () => {
  const directory = await mkdtemp(
    join(tmpdir(), 'graphql glob compatibility-'),
  );
  try {
    const files = {
      'graphql.config.json': JSON.stringify({
        schema: './schema.graphql',
        documents: './**/*.{graphql,gql}',
      }),
      'schema.graphql': 'type Query { hello: String }',
      'operations/root.graphql': 'fragment RootFields on Query { hello }',
      'operations/nested/other.gql': 'fragment NestedFields on Query { hello }',
      'operations/__generated__/ignored.graphql':
        'fragment GeneratedFields on Query { hello }',
      'node_modules/ignored.graphql':
        'fragment DependencyFields on Query { hello }',
    };
    for (const [filename, contents] of Object.entries(files)) {
      const filepath = join(directory, filename);
      await mkdir(dirname(filepath), { recursive: true });
      await writeFile(filepath, contents);
    }
    const config = await loadConfig({
      filepath: join(directory, 'graphql.config.json'),
    });
    const cache = new GraphQLCache({
      configDir: directory,
      config: config!,
      parser: parseDocument,
      logger: new NoopLogger(),
    });
    const fragments = await cache.getFragmentDefinitions(config!.getDefault());
    expect([...fragments.keys()].sort()).toEqual([
      'NestedFields',
      'RootFields',
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
