import { afterEach, expect, it, vi } from 'vitest';
import { MockProject } from './__utils__/MockProject';

let project: MockProject | undefined;

afterEach(() => {
  project?.dispose();
  project = undefined;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('loads dotEnvPath without changing literal hashes, overriding existing values or writing to LSP stdout', async () => {
  const env = {
    GRAPHIQL_TEST_DOTENV_HASH: undefined,
    GRAPHIQL_TEST_DOTENV_SPACED_HASH: undefined,
    GRAPHIQL_TEST_DOTENV_QUOTED: undefined,
    GRAPHIQL_TEST_DOTENV_EMPTY: undefined,
    GRAPHIQL_TEST_DOTENV_EXISTING: 'host value',
  };
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  project = new MockProject({
    settings: { dotEnvPath: './environment.env' },
    files: [
      ['graphql.config.json', '{"schema":"./schema.graphql"}'],
      ['schema.graphql', 'type Query { hello: String }'],
      ['query.graphql', '{ hello }'],
      [
        'environment.env',
        [
          'GRAPHIQL_TEST_DOTENV_HASH=secret#suffix',
          'GRAPHIQL_TEST_DOTENV_SPACED_HASH=secret #suffix',
          'GRAPHIQL_TEST_DOTENV_QUOTED="secret #suffix"',
          'GRAPHIQL_TEST_DOTENV_EMPTY=',
          'GRAPHIQL_TEST_DOTENV_EXISTING=file value',
        ].join('\n'),
      ],
    ],
  });
  const stdout = vi.spyOn(process.stdout, 'write');

  const result = await project.init();

  expect(result.diagnostics).toEqual([]);
  expect(process.env.GRAPHIQL_TEST_DOTENV_HASH).toBe('secret#suffix');
  expect(process.env.GRAPHIQL_TEST_DOTENV_SPACED_HASH).toBe('secret #suffix');
  expect(process.env.GRAPHIQL_TEST_DOTENV_QUOTED).toBe('secret #suffix');
  expect(process.env.GRAPHIQL_TEST_DOTENV_EMPTY).toBe('');
  expect(process.env.GRAPHIQL_TEST_DOTENV_EXISTING).toBe('host value');
  expect(stdout).not.toHaveBeenCalled();
});
