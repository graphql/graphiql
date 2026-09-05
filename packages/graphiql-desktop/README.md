# graphiql-desktop

A standalone [GraphiQL](https://github.com/graphql/graphiql) desktop app, built with Electron.

GraphQL requests are executed in Electron's main process instead of the
renderer, so they run outside the browser's CORS sandbox — point it at any
GraphQL API, including ones that don't send permissive CORS headers.

**Status:** early / experimental.

## Downloads

Packaged builds are attached to [GitHub Releases](https://github.com/graphql/graphiql/releases)
tagged `graphiql-desktop@<version>`:

- **macOS:** `GraphiQL-<version>-mac-arm64.dmg` / `GraphiQL-<version>-mac-x64.dmg`
  (`.zip` variants are also provided for auto-update tooling)
- **Linux:** `GraphiQL-<version>-linux-x86_64.AppImage` /
  `GraphiQL-<version>-linux-arm64.AppImage` / `GraphiQL-<version>-linux-amd64.deb`
- **Windows:** `GraphiQL-<version>-win-x64.exe`

Each release also includes a `SHA256SUMS-<platform>.txt` (one per OS the
build ran on) to verify a download against.

Builds are unsigned (see Limitations below), so:

- **macOS:** Gatekeeper will refuse to open the app with a plain double-click
  ("GraphiQL is damaged and can't be opened" or similar). Either right-click
  the app and choose **Open**, or clear the quarantine attribute from a
  terminal: `xattr -d com.apple.quarantine /Applications/GraphiQL.app`.
- **Windows:** SmartScreen will warn about an unrecognized publisher; choose
  **More info → Run anyway**.

## Running from source

```sh
yarn install
yarn workspace graphiql-desktop electron:setup # downloads the Electron binary (skipped by `yarn install` because `enableScripts` is disabled repo-wide)
yarn workspace graphiql-desktop build
yarn workspace graphiql-desktop start
```

## Packaging

```sh
yarn workspace graphiql-desktop build
yarn workspace graphiql-desktop dist # electron-builder; packages this machine's OS to packages/graphiql-desktop/release/
```

electron-builder config lives in `electron-builder.yml`. Builds are unsigned
(no Apple notarization, no Windows Authenticode) — that's intentional for
now; see Limitations.

## E2E tests

A Playwright test (`e2e/app.spec.mts`) launches the built app via Electron's
`_electron` API, points it at a local mock GraphQL server, and asserts the
schema loads through the real IPC → main-process fetch path. It needs a
display, so it's wired into CI (via `xvfb-run`) rather than run locally in
this repo's typical headless dev setup:

```sh
yarn workspace graphiql-desktop build
yarn workspace graphiql-desktop electron:setup
yarn workspace graphiql-desktop e2e
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
- Builds are unsigned: no Apple notarization, no Windows Authenticode.
- No auto-update — installing a new version means downloading and running
  the new installer.
