# graphiql-desktop

A standalone [GraphiQL](https://github.com/graphql/graphiql) desktop app, built with Electron.

GraphQL requests are executed in Electron's main process instead of the
renderer, so they run outside the browser's CORS sandbox — point it at any
GraphQL API, including ones that don't send permissive CORS headers.

**Status:** early / experimental. Not yet distributed as a packaged binary
(that's coming — see below).

## Running from source

```sh
yarn install
yarn workspace graphiql-desktop electron:setup # downloads the Electron binary (skipped by `yarn install` because `enableScripts` is disabled repo-wide)
yarn workspace graphiql-desktop build
yarn workspace graphiql-desktop start
```

## How it works

- The renderer is a small React app: an endpoint bar (persisted to
  `localStorage`) above a `<GraphiQL>` instance.
- The renderer's `fetcher` calls out over IPC (`graphiql:fetch`) to the main
  process, which validates the payload and performs the actual `fetch()`.
- The built renderer is served from a privileged custom `graphiql-desktop://`
  scheme rather than `file://`, so it gets a real origin — `localStorage` and
  monaco's module workers both need one to work correctly.

## Limitations

- No subscriptions (`graphql-ws`) or `@defer`/`@stream` incremental delivery
  support yet.
- Builds are unsigned.
- No packaged binaries yet — `electron-builder` packaging and GitHub release
  artifacts (dmg/AppImage/exe) are being wired up in a follow-up.
