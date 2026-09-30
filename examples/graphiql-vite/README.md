# GraphiQL Vite example

This example uses GraphiQL's Vite worker helper. Its configuration excludes the worker setup modules from pre-bundling so Vite can process their `?worker` imports.

## Setup

1. Run `pnpm dev` to start the development server.
2. Check schema completion, unknown-field and variables JSON diagnostics, and Prettify in the browser.
3. Run `pnpm build` to create the production files in `dist`.
4. Run `pnpm start` to preview the production build and repeat the browser checks.

After changing dependency optimization, restart the development server with `pnpm dev --force` if its cache is stale. If you configure the explicit worker factories shown in the migration guide instead of importing the helper, you can omit `optimizeDeps` entirely. Vite 8's default worker format is sufficient for this example.

See the [migration guide](../../docs/migration/graphiql-6.0.0.md#vite-development-and-production) for explicit worker factories and the complete configuration.
