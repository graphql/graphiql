import mockfs from 'mock-fs';
import { join } from 'node:path';
import { MockFile, MockProject } from './__utils__/MockProject';
// import { readFileSync } from 'node:fs';
import { FileChangeType } from 'vscode-languageserver';
import { serializeRange } from './__utils__/utils';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { URI } from 'vscode-uri';

const defaultFiles = [
  ['query.graphql', 'query { bar ...B }'],
  ['fragments.graphql', 'fragment B on Foo { bar }'],
] as MockFile[];
const schemaFile: MockFile = [
  'schema.graphql',
  'type Query { foo: Foo, test: Test }\n\ntype Foo { bar: String }\n\ntype Test { test: Foo }',
];

const fooTypePosition = {
  start: { line: 2, character: 0 },
  end: { line: 2, character: 24 },
};

const genSchemaPath =
  '/tmp/graphql-language-service/test/projects/default/generated-schema.graphql';

// TODO:
// - reorganize into multiple files
// - potentially a high level abstraction and/or it.each() for a pathway across configs, file extensions, etc.
//   this may be cumbersome with offset position assertions but possible
//   if we can create consistency that doesn't limit variability
// - convert each it() into a nested describe() block (or a top level describe() in another file), and sprinkle in it() statements to replace comments
// - fix TODO comments where bugs were found that couldn't be resolved quickly (2-4hr time box)

describe('MessageProcessor with no config', () => {
  afterEach(() => {
    mockfs.restore();
  });
  it('fails to initialize with empty config file', async () => {
    const project = new MockProject({
      files: [...defaultFiles, ['graphql.config.json', '']],
    });
    await project.init();

    expect(project.lsp._logger.info).toHaveBeenCalledTimes(1);
    expect(project.lsp._logger.error).toHaveBeenCalledTimes(1);
    expect(project.lsp._logger.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /GraphQL Config file is not available in the provided config directory/,
      ),
    );
    expect(project.lsp._isInitialized).toEqual(false);
    expect(project.lsp._isGraphQLConfigMissing).toEqual(true);
  });
  it('fails to initialize with no config file present', async () => {
    const project = new MockProject({
      files: [...defaultFiles],
    });
    await project.init();

    expect(project.lsp._logger.error).toHaveBeenCalledTimes(1);
    expect(project.lsp._logger.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /GraphQL Config file is not available in the provided config directory/,
      ),
    );
    expect(project.lsp._isInitialized).toEqual(false);
    expect(project.lsp._isGraphQLConfigMissing).toEqual(true);
  });
  it('initializes when presented with a valid config later', async () => {
    const project = new MockProject({
      files: [...defaultFiles],
    });
    await project.init();
    expect(project.lsp._isInitialized).toEqual(false);
    expect(project.lsp._isGraphQLConfigMissing).toEqual(true);
    expect(project.lsp._logger.error).toHaveBeenCalledTimes(1);

    project.changeFile(
      'graphql.config.json',
      '{ "schema": "./schema.graphql" }',
    );
    // TODO: this should work for on watched file changes as well!
    await project.lsp.handleDidOpenOrSaveNotification({
      textDocument: {
        uri: project.uri('graphql.config.json'),
      },
    });
    expect(project.lsp._isInitialized).toEqual(true);
    expect(project.lsp._isGraphQLConfigMissing).toEqual(false);
    expect(project.lsp._graphQLCache).toBeDefined();
  });
});

describe('the lsp', () => {
  let app;
  afterEach(() => {
    mockfs.restore();
  });
  beforeAll(async () => {
    app = await import('../../../graphiql/test/e2e-server');
  });
  afterAll(() => {
    app.server.close();
    app.wsServer.close();
  });
  it('caches files and schema with .graphql file config, and the schema updates with watched file changes', async () => {
    const project = new MockProject({
      files: [
        schemaFile,
        [
          'graphql.config.json',
          '{ "schema": "./schema.graphql", "documents": "./**.graphql" }',
        ],
        ...defaultFiles,
      ],
    });
    const results = await project.init('query.graphql');
    expect(results.diagnostics[0].message).toEqual(
      'Cannot query field "bar" on type "Query".',
    );
    expect(results.diagnostics[1].message).toEqual(
      'Fragment "B" cannot be spread here as objects of type "Query" can never be of type "Foo".',
    );
    console.log(
      'schema',
      project.lsp._getCachedDocument(project.uri('schema.graphql')),
    );
    const initSchemaDefRequest = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('schema.graphql') },
      position: { character: 19, line: 0 },
    });
    const typeCache1 = project.lsp._graphQLCache._typeDefinitionsCache;
    console.log('schema1', typeCache1);
    expect(initSchemaDefRequest.length).toEqual(1);
    expect(initSchemaDefRequest[0].uri).toEqual(project.uri('schema.graphql'));
    expect(serializeRange(initSchemaDefRequest[0].range)).toEqual(
      fooTypePosition,
    );
    expect(project.lsp._logger.error).not.toHaveBeenCalled();
    expect(await project.lsp._graphQLCache.getSchema('default')).toBeDefined();
    // TODO: for some reason the cache result formats the graphql query??
    // const docCache = project.lsp._graphQLCache._getDocumentCache('default');
    // expect(
    //   docCache.get(project.uri('query.graphql'))!.contents[0].documentString,
    // ).toContain('...B');
    const schemaDefinitions = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('fragments.graphql') },
      position: { character: 16, line: 0 },
    });
    expect(schemaDefinitions[0].uri).toEqual(project.uri('schema.graphql'));

    expect(serializeRange(schemaDefinitions[0].range)).toEqual(fooTypePosition);

    // query definition request of fragment name jumps to the fragment definition
    const firstQueryDefRequest = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('query.graphql') },
      position: { character: 16, line: 0 },
    });
    expect(firstQueryDefRequest[0].uri).toEqual(
      project.uri('fragments.graphql'),
    );
    expect(serializeRange(firstQueryDefRequest[0].range)).toEqual({
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 0,
        character: 25,
      },
    });
    // change the file to make the fragment invalid
    project.changeFile(
      'schema.graphql',
      // now Foo has a bad field, the fragment should be invalid
      'type Query { foo: Foo, test: Test }\n\n type Test { test: String }\n\n\n\n\ntype Foo { bad: Int }',
    );
    await project.lsp.handleWatchedFilesChangedNotification({
      changes: [
        { uri: project.uri('schema.graphql'), type: FileChangeType.Changed },
      ],
    });
    const typeCache =
      project.lsp._graphQLCache._typeDefinitionsCache.get('/tmp/test-default');
    expect(typeCache?.get('Test')?.definition.name.value).toEqual('Test');

    // test in-file schema defs! important!
    const schemaDefRequest = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('schema.graphql') },
      position: { character: 19, line: 0 },
    });

    const fooLaterTypePosition = {
      start: { line: 7, character: 0 },
      end: { line: 7, character: 21 },
    };
    expect(schemaDefRequest.length).toEqual(1);
    expect(schemaDefRequest[0].uri).toEqual(project.uri('schema.graphql'));
    expect(serializeRange(schemaDefRequest[0].range)).toEqual(
      fooLaterTypePosition,
    );

    // change the file to make the fragment invalid
    // project.changeFile(
    //   'schema.graphql',
    //   // now Foo has a bad field, the fragment should be invalid
    //   'type Query { foo: Foo, test: Test }\n\n type Test { test: String }\n\n\n\n\n\ntype Foo { bad: Int }',
    // );
    // await project.lsp.handleWatchedFilesChangedNotification({
    //   changes: [
    //     {
    //       type: FileChangeType.Changed,
    //       uri: project.uri('schema.graphql'),
    //     },
    //   ],
    // });

    const newSchema =
      'type Query { foo: Foo, test: Test }\n\n type Test { test: String }\n\n\n\n\n\ntype Foo { bad: Int }';
    await project.lsp.handleDidChangeNotification({
      contentChanges: [
        {
          type: FileChangeType.Changed,
          text: newSchema,
          range: {
            start: { line: 0, character: 0 },
            end: { line: newSchema.split('\n').length, character: 21 },
          },
        },
      ],
      textDocument: { uri: project.uri('schema.graphql'), version: 1 },
    });

    const schemaDefRequest2 = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('schema.graphql') },
      position: { character: 19, line: 0 },
    });

    const fooLaterTypePosition2 = {
      start: { line: 8, character: 0 },
      end: { line: 8, character: 21 },
    };
    expect(schemaDefRequest2.length).toEqual(1);
    expect(schemaDefRequest2[0].uri).toEqual(project.uri('schema.graphql'));
    expect(serializeRange(schemaDefRequest2[0].range)).toEqual(
      fooLaterTypePosition2,
    );

    // TODO: this fragment should now be invalid
    const result = await project.lsp.handleDidOpenOrSaveNotification({
      textDocument: { uri: project.uri('fragments.graphql') },
    });
    expect(result.diagnostics[0].message).toEqual(
      'Cannot query field "bar" on type "Foo". Did you mean "bad"?',
    );
    const generatedFile = existsSync(join(genSchemaPath));
    // this generated file should not exist because the schema is local!
    expect(generatedFile).toEqual(false);
    // simulating codegen
    project.changeFile(
      'fragments.graphql',
      'fragment A on Foo { bar }\n\nfragment B on Test { test }',
    );
    await project.lsp.handleWatchedFilesChangedNotification({
      changes: [
        { uri: project.uri('fragments.graphql'), type: FileChangeType.Changed },
      ],
    });

    // TODO: this interface should maybe not be tested here but in unit tests
    const fragCache =
      project.lsp._graphQLCache._fragmentDefinitionsCache.get(
        '/tmp/test-default',
      );
    expect(fragCache?.get('A')?.definition.name.value).toEqual('A');
    expect(fragCache?.get('B')?.definition.name.value).toEqual('B');

    // on the second request, the position has changed
    const secondQueryDefRequest = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('query.graphql') },
      position: { character: 16, line: 0 },
    });
    expect(secondQueryDefRequest[0].uri).toEqual(
      project.uri('fragments.graphql'),
    );
    expect(serializeRange(secondQueryDefRequest[0].range)).toEqual({
      start: {
        line: 2,
        character: 0,
      },
      end: {
        line: 2,
        character: 27,
      },
    });
    // definitions request for fragments jumps to a different place in schema.graphql now
    const schemaDefinitionsAgain = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('fragments.graphql') },
      position: { character: 16, line: 0 },
    });
    expect(schemaDefinitionsAgain[0].uri).toEqual(
      project.uri('schema.graphql'),
    );

    expect(serializeRange(schemaDefinitionsAgain[0].range)).toEqual(
      fooLaterTypePosition2,
    );
    expect(project.lsp._logger.error).not.toHaveBeenCalled();
  });

  it('caches files and schema with a URL config', async () => {
    const project = new MockProject({
      files: [
        ['query.graphql', 'query { test { isTest, ...T } }'],
        ['fragments.graphql', 'fragment T on Test {\n isTest \n}'],
        [
          'graphql.config.json',
          '{ "schema": "http://localhost:3100/graphql", "documents": "./**" }',
        ],
      ],
    });

    const initParams = await project.init('query.graphql');
    expect(project.lsp._logger.error).not.toHaveBeenCalled();

    expect(initParams.diagnostics).toEqual([]);

    // schema file is present and contains schema
    const file = await readFile(join(genSchemaPath), { encoding: 'utf-8' });
    expect(file.split('\n').length).toBeGreaterThan(10);
    expect(await project.lsp._graphQLCache.getSchema('default')).toBeDefined();

    const changeParams = await project.lsp.handleDidChangeNotification({
      textDocument: { uri: project.uri('query.graphql'), version: 1 },
      contentChanges: [
        {
          text: 'query { test { isTest, ...T or }  }',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 35 },
          },
        },
      ],
    });
    expect(changeParams?.diagnostics[0].message).toEqual(
      'Cannot query field "or" on type "Test".',
    );

    // hover works
    const hover = await project.lsp.handleHoverRequest({
      position: {
        character: 10,
        line: 0,
      },
      textDocument: { uri: project.uri('query.graphql') },
    });
    expect(hover.contents).toContain('`test` field from `Test` type.');

    // ensure that fragment definitions work
    const definitions = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('query.graphql') },
      position: { character: 26, line: 0 },
    });
    expect(definitions[0].uri).toEqual(project.uri('fragments.graphql'));
    expect(serializeRange(definitions[0].range)).toEqual({
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 2,
        character: 1,
      },
    });

    const typeDefinitions = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('fragments.graphql') },
      position: { character: 15, line: 0 },
    });

    expect(typeDefinitions[0].uri).toEqual(URI.parse(genSchemaPath).toString());

    expect(serializeRange(typeDefinitions[0].range)).toEqual({
      start: {
        line: 10,
        character: 0,
      },
      end: {
        line: 98,
        character: 1,
      },
    });

    const schemaDefs = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: URI.file(genSchemaPath).toString() },
      position: { character: 20, line: 17 },
    });
    expect(schemaDefs[0].uri).toEqual(URI.parse(genSchemaPath).toString());
    // note: if the graphiql test schema changes,
    // this might break, please adjust if you see a failure here
    expect(serializeRange(schemaDefs[0].range)).toEqual({
      start: {
        line: 100,
        character: 0,
      },
      end: {
        line: 108,
        character: 1,
      },
    });
    // lets remove the fragments file
    await project.deleteFile('fragments.graphql');
    // and add a fragments.ts file, watched
    await project.addFile(
      'fragments.ts',
      '\n\n\nexport const fragment = gql`\n\n  fragment T on Test { isTest }\n`',
      true,
    );

    // await project.lsp.handleWatchedFilesChangedNotification({
    //   changes: [
    //     { uri: project.uri('fragments.ts'), type: FileChangeType.Created },
    //   ],
    // });
    const defsForTs = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('query.graphql') },
      position: { character: 26, line: 0 },
    });
    // this one is really important
    expect(defsForTs[0].uri).toEqual(project.uri('fragments.ts'));
    expect(serializeRange(defsForTs[0].range)).toEqual({
      start: {
        line: 5,
        character: 2,
      },
      end: {
        line: 5,
        character: 31,
      },
    });
    expect(project.lsp._logger.error).not.toHaveBeenCalled();
  });

  it('caches multiple projects with files and schema with a URL config and a local schema', async () => {
    const project = new MockProject({
      files: [
        [
          'a/fragments.ts',
          '\n\n\nexport const fragment = gql`\n\n  fragment TestFragment on Test { isTest }\n`',
        ],
        [
          'a/query.ts',
          '\n\n\nexport const query = graphql`query { test { isTest ...T } }`',
        ],

        [
          'b/query.ts',
          'import graphql from "graphql"\n\n\nconst a = graphql` query example { test() { isTest ...T }  }`',
        ],
        [
          'b/fragments.ts',
          '\n\n\nexport const fragment = gql`\n\n  fragment T on Test { isTest }\n`',
        ],
        ['b/schema.graphql', schemaFile[1]],
        [
          'package.json',
          `{ "graphql": { "projects": { 
              "a": { "schema": "http://localhost:3100/graphql", "documents": "./a/**" }, 
              "b": { "schema": "./b/schema.graphql", "documents": "./b/**" }  }
            } 
          }`,
        ],
        schemaFile,
      ],
    });

    const initParams = await project.init('a/query.ts');
    expect(initParams.diagnostics[0].message).toEqual('Unknown fragment "T".');

    expect(project.lsp._logger.error).not.toHaveBeenCalled();
    expect(await project.lsp._graphQLCache.getSchema('a')).toBeDefined();
    const file = await readFile(join(genSchemaPath.replace('default', 'a')), {
      encoding: 'utf-8',
    });
    expect(file.split('\n').length).toBeGreaterThan(10);
    // add a new typescript file with empty query to the b project
    // and expect autocomplete to only show options for project b
    await project.addFile(
      'b/empty.ts',
      'import gql from "graphql-tag"\ngql`query a {    }`',
    );
    const completion = await project.lsp.handleCompletionRequest({
      textDocument: { uri: project.uri('b/empty.ts') },
      position: { character: 13, line: 1 },
    });

    expect(completion.items?.length).toEqual(5);
    expect(completion.items.map(i => i.label)).toEqual([
      'foo',
      'test',
      '__typename',
      '__schema',
      '__type',
    ]);
    // this confirms that autocomplete respects cross-project boundaries for types.
    // it performs a definition request for the foo field in Query
    const schemaCompletion1 = await project.lsp.handleCompletionRequest({
      textDocument: { uri: project.uri('b/schema.graphql') },
      position: { character: 21, line: 0 },
    });
    expect(schemaCompletion1.items.map(i => i.label)).toEqual(['Foo']);
    // it performs a definition request for the Foo type in Test.test
    const schemaDefinition = await project.lsp.handleDefinitionRequest({
      textDocument: { uri: project.uri('b/schema.graphql') },
      position: { character: 21, line: 4 },
    });
    expect(serializeRange(schemaDefinition[0].range)).toEqual(fooTypePosition);

    // simulate a watched schema file change (codegen, etc)
    project.changeFile(
      'b/schema.graphql',
      schemaFile[1] + '\ntype Example1 { field:    }',
    );
    await project.lsp.handleWatchedFilesChangedNotification({
      changes: [
        { uri: project.uri('b/schema.graphql'), type: FileChangeType.Changed },
      ],
    });
    // TODO: repeat this with other changes to the schema file and use a
    // didChange event to see if the schema updates properly as well
    // await project.lsp.handleDidChangeNotification({
    //   textDocument: { uri: project.uri('b/schema.graphql'), version: 1 },
    //   contentChanges: [
    //     { text: schemaFile[1] + '\ntype Example1 { field:    }' },
    //   ],
    // });
    console.log(project.fileCache.get('b/schema.graphql'));
    console.log(project.lsp._graphQLCache.getSchema('b'));
    const schemaCompletion = await project.lsp.handleCompletionRequest({
      textDocument: { uri: project.uri('b/schema.graphql') },
      position: { character: 24, line: 5 },
    });
    // TODO: SDL completion still feels incomplete here... where is Int?
    // where is self-referential Example1?
    expect(schemaCompletion.items.map(i => i.label)).toEqual([
      'Query',
      'Foo',
      'String',
      'Test',
      'Boolean',
    ]);

    expect(project.lsp._logger.error).not.toHaveBeenCalled();
  });
});
