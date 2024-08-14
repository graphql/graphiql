# GraphQL Syntax Support

Adds full GraphQL syntax highlighting and language support such as bracket
matching.

- Supports `.graphql`/`.gql`/`.graphqls` highlighting
- Javascript, Typescript & JSX/TSX (examples: [test.js](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.js) & [test.ts](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.ts))
- Vue (examples: [test-sfc-comp.vue](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test-sfc-comp.vue) & [test-sfc.vue](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test-sfc.vue))
- Svelte (example: [test.svelte](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.svelte))
- ReasonML/ReScript (`%graphql()` ) (example: [test.re](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.re))
- Python (example: [test.py](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.py))
- PHP (example: [test.php](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.php))
- Markdown (examples: [test.md](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.md) & [test-py.md](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test-py.md))
- Scala (example: [test.scala](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.scala))

You'll want to install this if you do not use `graphql-config`, or want to use
the highlighting with other extensions than `vscode-graphql`

## Contributing

Feel free to open a PR to fix, enhance any language support, or even add new
languages 😍

see:

- [the grammars](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/grammars/)
- [the applicable vscode docs](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)

### Contributor Guide: Improving a Language

Whether fixing a bug or adding a new delimiter for your language, here are a few tips for you:

1. TDD approach: add your bug case or new delimiter example to the relevant file in `tests/__fixtures__`
1. run `yarn test -u` in the syntax extension workspace, and observe whether vscode-textmate tokenizes your example properly
1. fix/update/add the relevant pattern, and repeat the above to see if the tokenization changes. you should see `meta.embedded.block.graphql`
1. to test manually, run `yarn vsce:package` in the workspace and right click to install the bundled vsix extension, and open the fixture file

<span id="adding-a-lang"></span>

### Contributor Guide: Adding a Language

1.  add a file to [grammars](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/grammars/) following our other examples.
1.  be sure to add it to `package.json` contributions as well, in the `grammars` section. the `text.html.markdown` is for applying to markdown codeblocks
1.  use a scope ala `source.{lang}` from a vscode-provided syntax grammar, or a popular, official contributed grammar. To find the name of the scope for any token's highlighting, use `Developer: Inspect Editor Tokens & Scopes` from the vscode command palette.
1.  name it `inline.graphql.{lang}` for consistency
1.  add a test file `tests/__fixture__` to document example usage, and a test spec to `__tests__` to assert the snapshot, pointing to the source you created
1.  run `yarn test -u` in the workspace to add the snapshot
1.  use the snapshots to ensure your capture groups are working and serializing the graphql as expected
1.  in the test fixture, document all working cases and non working cases with Todo comments for common usage in your language. be sure to think of cases such as string interpolation and generics for typed languages.
1.  add it to the list above in the readme, with links to your test fixtures as usage documentation
1.  to manually test it in vscode itself, run `yarn vsce:package` in the syntax extension workspace and right click and install the bundled vsix file, then view the test fixture

## Usage Note

We would love for the other graphql extension authors to freely use this syntax
extension as well! Even if your extension is designed to replace
`vscode-graphql`, or if it's designed for other other purposes. It uses an MIT
license, but attribution is always a nice gesture to the original authors :)

## License

MIT License

Copyright 2022 GraphQL Contributors
