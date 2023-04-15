# GraphQL Syntax Support

Adds full GraphQL syntax highlighting and language support such as bracket
matching.

- Supports `.graphql`/`.gql`/`.graphqls` highlighting
- [Javascript, Typescript & JSX/TSX](#ts) & Vue & Svelte
- ReasonML/ReScript (`%graphql()` )
- Python
- PHP
- [Markdown](#markdown)
- [Scala](#scala)

You'll want to install this if you do not use `graphql-config`, or want to use
the highlighting with other extensions than `vscode-graphql`

## Embedded Language Usage

<span id="ts">
### Javascript & Typescript

The following delimiters are accepted for syntax highlighting. If you are using
any of these patterns and they do not work, please open an issue!

#### Template Literal Expressions

```ts
const query = gql`
  {
    id
  }
`;
```

you can use these template tag literal expressions anywhere you like of course

```ts
useFancyGraphQLClient(
  graphql`
    {
      id
    }
  `,
  {
    networkStrategy: '🚀',
  },
);
```

```ts
const query = gql.experimental`{ id }`;
```

and in typescript, template tag expressions with type arguments

```ts
const query = gql<MyType>`
  {
    id
  }
`;
```

#### Function Expressions

as well as normal function expressions with template literals

```ts
gql(`{ id }`);
```

```ts
graphql(
  `
    {
      id
    }
  `,
);
```

there is a bug with function expressions with type arguments like these that we
need to fix:

```ts
gql<MyType>(`{ id }`);
```

Note, inline `""` and `''` string literals could also be delimited if needed,
but we currently only delimit graphql template strings for obvious reasons

#### Comment-Delimited patterns

```ts
const query = /* GraphQL */ `
  {
    id
  }
`;
```

```ts
const query = `#graphql
 { id }
`;
```

For full autocompletion, validation and other features, you can install
`GraphQL.vscode-graphql`, which depends on this extension

<span id="markdown">

### Markdown

#### backtick code blocks

````markdown
# Hello Jan

```graphql
query MyQuery {}
```
````

#### embedded graphql in js & ts codeblocks

simple js/ts`gql` & `graphql` template tag expression support inside any
backtick codeblocks.

````markdown
# Hello Jan

```js
gql`
{
  its {
    query
    time
  }
}
```
````

#### Scala

Using a `graphql`, `gql` or `schema` string interpolator:

```scala
val query = graphql"""
  { id }
"""
val query2 = gql"""
  { id }
"""
val query3 = schema"""
  { id }
"""
```

Using a comment-delimited pattern:

```scala
val query = """#graphql
 { id }
"""
```

## Other languages

We actually support other languages than this! just need to extend this readme
even further! 🥵

## Contributing

Feel free to open a PR to fix, enhance any language support, or even add new
languages 😍

see:

- [the grammars](grammars/)
- [the applicable vscode docs](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)

## Usage Note

We would love for the other graphql extension authors to freely use this syntax
extension as well! Even if your extension is designed to replace
`vscode-graphql`, or if it's designed for other other purposes. It uses an MIT
license, but attribution is always a nice gesture to the original authors :)

## License

MIT License

Copyright 2022 GraphQL Contributors
