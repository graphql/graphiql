/**
 * ⚠️ Not for ordinary Vite apps: Vite pre-bundles dependencies with esbuild,
 * which cannot process the `?worker` imports inside this module, and the dev
 * server fails to start. Vite apps must configure workers with
 * `vite-plugin-monaco-editor` instead — see the "Monaco worker setup" section
 * of docs/migration/graphiql-6.0.0.md.
 */
import '@graphiql/react/setup-workers/vite';
