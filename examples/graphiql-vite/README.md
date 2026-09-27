# GraphiQL Vite example

This example uses GraphiQL's Vite worker helper. Its configuration includes ESM workers and optimization entries for the GraphQL worker dependencies and Prettier parsers.

## Setup

1. Run `pnpm dev` to start the development server.
2. Check schema completion, unknown-field and variables JSON diagnostics, and Prettify in the browser.
3. Run `pnpm build` to create the production files in `dist`.
4. Run `pnpm start` to preview the production build and repeat the browser checks.

After changing dependency optimization, restart the development server with `pnpm dev --force` if its cache is stale. These optimization entries are also needed by affected v5 Vite integrations; they are separate from the v6 Monaco worker-path migration.

See the [migration guide](../../docs/migration/graphiql-6.0.0.md#vite-development-and-production) for explicit worker factories and the complete configuration.
