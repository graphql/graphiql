# Getting started

Before landing a contribution, sign the [GraphQL Specification Membership agreement](https://github.com/graphql/graphql-wg/tree/main/membership). EasyCLA will prompt you on your pull request if you haven't signed it.

1. Install Git, Node.js 24 (see `.node-version`), and pnpm. Use pnpm for repository commands.
2. Fork and clone the repository:

   ```sh
   git clone https://github.com/YOUR_USERNAME/graphiql.git
   cd graphiql
   ```

3. Install dependencies:

   ```sh
   pnpm install --frozen-lockfile
   ```

4. Choose a development command below. Turbo builds workspace dependencies before starting the selected task.

## Build packages

Build the repository's default package and example set:

```sh
pnpm build
```

Build GraphiQL and its dependencies:

```sh
pnpm build:graphiql
```

For another package, use its name from `package.json`. The trailing `...` includes its workspace dependencies:

```sh
pnpm exec turbo run build --filter=monaco-graphql...
```

Each package declares its compiler and build command. Turbo orders package builds and caches their outputs. A direct command such as `pnpm --filter @graphiql/react build` runs only that package; build its workspace dependencies first.

The default repository build excludes the Monaco examples and the GraphiQL webpack example. Build an excluded example explicitly when working on it:

```sh
pnpm exec turbo run build --filter=example-monaco-graphql-react-vite...
```

## Develop GraphiQL

Start GraphiQL and watch its dependencies:

```sh
pnpm dev:graphiql
```

Open the Vite URL printed in the terminal. The GraphQL test server runs on port 8080. Turbo rebuilds dependencies and restarts the application when their inputs change. Select only the application for `dev`; its build prerequisites include the required libraries, so separate library watchers aren't needed.

To develop the Vite example instead, run:

```sh
pnpm dev:example-vite
```

## Develop Monaco GraphQL

Start the Monaco Vite example with its workspace dependencies:

```sh
pnpm exec turbo watch dev --filter=example-monaco-graphql-react-vite
```

To watch only the library builds, run:

```sh
pnpm run build:watch -- --filter=monaco-graphql...
```

`pnpm build:watch` without a filter watches the default repository build set. It uses the same package build commands as `pnpm build`, including declaration generation and the Monaco type patch. `pnpm watch` is an alias.

## Develop the VS Code extensions

Use the corresponding command to build and watch an extension and its dependencies:

```sh
pnpm watch-vscode
pnpm watch-vscode-exec
```

Run one command per terminal, or start the matching VS Code task. The debugger waits for a successful extension bundle before launching. Turbo reruns the finite compiler and bundler tasks when workspace sources change.

## Test and check types

Run the package tests:

```sh
pnpm test
```

Run one package's tests with its required builds:

```sh
pnpm exec turbo run test --filter=cm6-graphql
```

Check types across the repository:

```sh
pnpm types:check
```

Use `pnpm lint` for lint, formatting, and spelling checks. Use `pnpm format` to apply formatting. To run GraphiQL's end-to-end tests against the compiled app, build it with `pnpm build:graphiql`, then run `CI=true pnpm e2e`. The `CI` setting makes the test server serve the built app on port 8080.

## Clean and rebuild

`pnpm build` reuses valid Turbo cache entries. To remove generated package outputs, extension bundles, and staged demos before building, run:

```sh
pnpm build:rebuild
```

Cleaning preserves installed dependencies, source files, and the Turbo cache. To re-execute build tasks instead of restoring cached outputs, run:

```sh
pnpm run build:rebuild -- --force
```

`pnpm build:clean` only removes generated artifacts. `pnpm build-clean` is a compatibility alias. `pnpm build-bundles-clean` removes extension bundles and staged demos while preserving compiled packages.

## CI caching

GitHub Actions saves `.turbo/cache` between jobs and runs. Cache archives are grouped by runner OS, architecture, Node version file, and lockfile. Each job restores its previous results; dependent PR jobs also restore the current commit's build cache. Turbo checks each task's inputs before restoring its outputs; tasks with changed inputs run again. Jobs also build successfully when no cache is available.

The release workflow saves caches on `main` that pull requests can reuse. Caches created by a pull request are available to later runs of that same pull request. GitHub controls this [cache access](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#restrictions-for-accessing-a-cache).

This uses GitHub's cache storage and requires no Vercel account or Turbo credentials. Turbo still reports `Remote caching disabled` because GitHub restores its local cache directory before the command runs. Developer machines keep their own local caches.

To check reuse, rerun a completed PR workflow with **Re-run all jobs**. Look for a restored cache in the **Turbo cache** step and cached tasks in Turbo's summary. An empty or evicted cache makes the run slower but should not change its result.

## Build extension bundles and demos

Build the VS Code extension bundles into their `out` directories:

```sh
pnpm build-bundles
```

Build and stage the registered webpack demos for the GraphiQL site:

```sh
pnpm build-demo
```

Turbo builds each demo's dependencies first. Staging replaces the demo's directory under `packages/graphiql` on every run, including when the example build comes from cache. The CDN and CM6 example directories aren't registered workspaces and aren't included in this command.
