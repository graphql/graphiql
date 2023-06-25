# Monaco GraphQL Next.js Example

## Getting Started

This is a working example of `monaco-editor` and `monaco-graphql` using
`next.js` 13

It shows how to use the latest monaco-editor with next.js and a custom
webworker, without using `@monaco/react` or `monaco-editor-react`'s approach of
cdn (AMD) bundles. These approaches avoid using ESM `monaco-editor` or web
workers, which prevents introducing custom web workers like with
`monaco-graphql`.

For universal loading, we use `@next/loadable` with `{ssr: false}`, but any
similar client-side-only loading (with or without dynamic import) should be
fine. For more information on loading `monaco-editor` in esm contexts, you can
[read their docs](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md)

This work was sponsored by [Grafbase](https://grafbase.com)!

## Setup

1. In monorepo root directory run `yarn` and `yarn build`.
1. In this directory run `yarn dev`.
