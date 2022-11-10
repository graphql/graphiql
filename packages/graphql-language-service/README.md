# `graphql-language-service`

[Changelog](https://github.com/graphql/graphiql/blob/main/packages/graphql-language-service/CHANGELOG.md)
|
[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphql_language_service.html)
| [Discord](https://discord.gg/wkQCKwazxj)

> **Note**: Still mostly experimental, however it depends mostly on stable
> libraries. **Migration Note**: As of 3.0.0, the LSP Server command line
> interface has been moved to
> [`graphql-language-service-cli`](../graphql-language-service-cli)

## Purpose

This package brings together all the dependencies for building out web or
desktop IDE services for the GraphQL Language.

It is named as such to match the convention of other vscode language services.

## Interface

Language Service Protocol (LSP) methods written in TypeScript used by
[`graphql-language-service-server`](https://github.com/graphql/graphiql/tree/main/packages/graphql-language-service-server),
[`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)
and
[`codemirror-graphql`](https://github.com/graphql/graphiql/tree/main/packages/codemirror-graphql).

The goal is to provide methods for creating
[Language Server Protocol](https://langserver.org) compliant services to be used
by an IDE plugin, a browser application or desktop application.

## Parser

A standalone online, immutable, dependency-free parser for
[GraphQL](http://graphql.org/), used by the LSP interface methods

## Utils

Various utilities
