# GraphQL Syntax Support

Adds basic GraphQL highlighting and language support such as bracket matching.

Supports `.graphql`/`.gql`/`.graphqls` highlighting

## Supported Languages

### Javascript & Typescript

accepted template strings and expression patterns

```typescript
gql`
  {
    id
  }
`;
graphql`
  {
    id
  }
`;
gql<MyType>`
  {
    id
  }
`;
gql.experimental`{ id }`;
```

```typescript
gql('{ id }');
graphql('{ id }');
gql<MyType>('{ id }');
gql.experimental('{ id }');
```

accepted comment-delimited patterns

```ts
/* GraphiQL */
const query = `
 { id }
`;
const query = `#graphql
 { id }
`;
```

- ReasonML/ReScript (`%graphql()` )
- Python
- PHP
- Markdown for `graphql\`\``,`GraphQL\`\``and`gql\`\`` (even when deeply nested!)

For full autocompletion, validation and other features, you can install `GraphQL.vscode-graphql`, which depends on this extension
