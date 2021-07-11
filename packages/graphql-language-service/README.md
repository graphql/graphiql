# `graphql-language-service`

[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphql_language_service.html)
[Discord Channel](https://discord.gg/wkQCKwazxj)

> **Note**: Still mostly experimental, however it depends mostly on stable libraries.
> **Migration Note**: As of 3.0.0, the LSP command line interface has been moved to [`graphql-language-service-cli`](../graphql-language-service-cli)

## Purpose

This package brings together all the dependencies for building out web or desktop IDE services for the GraphQL Language.

It is named as such to match the convention of other vscode languageservices.

It also provides a new `LanguageService` class as browser/web-worker runtime friendly alternative to the one that lives in [`graphql-language-service-interface`](../graphql-language-service-cli), that utilizes the same underlying functions, meaning _most_ fixes and improvements from here on out will continue to be reflected by both implementations.

## Usage

Instantiates with these optional parameters:

```ts
type GraphQLLanguageConfig = {
  parser?: typeof parse;
  schemaLoader?: typeof defaultSchemaLoader;
  schemaBuilder?: typeof defaultSchemaBuilder;
  schemaConfig: SchemaConfig;
};
```

this is the minimum configuration required:

```ts
const languageService = new LanguageService({
  schemaConfig: { uri: 'https://my/schema' },
});
```
