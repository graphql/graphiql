# Getting started

Before landing a contribution, sign the [GraphQL Specification Membership agreement](https://github.com/graphql/graphql-wg/tree/main/membership). EasyCLA will prompt you on your pull request if you haven't signed it.

1. Install Git, Node.js 24 (see `.node-version`), and Yarn 4. Use Yarn for repository commands.
2. Fork and clone the repository:

   ```sh
   git clone https://github.com/YOUR_USERNAME/graphiql.git
   cd graphiql
   ```

3. Install dependencies:

   ```sh
   yarn install --immutable
   ```

4. Choose a development command below. Turbo builds workspace dependencies before starting the selected task.

## Build packages

Build the repository's default package and example set:

```sh
yarn build
```

Build GraphiQL and its dependencies:

```sh
yarn build:graphiql
```

For another package, use its name from `package.json`. The trailing `...` includes its workspace dependencies:

```sh
yarn turbo run build --filter=monaco-graphql...
```

Each package declares its compiler and build command. Turbo orders package builds and caches their outputs. A direct command such as `yarn workspace @graphiql/react build` runs only that package; build its workspace dependencies first.

The default repository build excludes the Monaco examples and the GraphiQL webpack example. Build an excluded example explicitly when working on it:

```sh
yarn turbo run build --filter=example-monaco-graphql-react-vite...
```

## Develop GraphiQL

Start GraphiQL and watch its dependencies:

```sh
yarn dev:graphiql
```

Open the Vite URL printed in the terminal. The GraphQL test server runs on port 8080. Turbo rebuilds dependencies and restarts the application when their inputs change. Select only the application for `dev`; its build prerequisites include the required libraries, so separate library watchers aren't needed.

To develop the Vite example instead, run:

```sh
yarn dev:example-vite
```

## Develop Monaco GraphQL

Start the Monaco Vite example with its workspace dependencies:

```sh
yarn turbo watch dev --filter=example-monaco-graphql-react-vite
```

To watch only the library builds, run:

```sh
yarn build:watch --filter=monaco-graphql...
```

`yarn build:watch` without a filter watches the default repository build set. It uses the same package build commands as `yarn build`, including declaration generation and the Monaco type patch. `yarn watch` is an alias.

## Develop the VS Code extensions

Use the corresponding command to build and watch an extension and its dependencies:

```sh
yarn watch-vscode
yarn watch-vscode-exec
```

Run one command per terminal, or start the matching VS Code task. The debugger waits for a successful extension bundle before launching. Turbo reruns the finite compiler and bundler tasks when workspace sources change.

## Test and check types

Run the package tests:

```sh
yarn test
```

Run one package's tests with its required builds:

```sh
yarn turbo run test --filter=cm6-graphql
```

Check types across the repository:

```sh
yarn types:check
```

Use `yarn lint` for lint, formatting, and spelling checks. Use `yarn format` to apply formatting. To run GraphiQL's end-to-end tests against the compiled app, build it with `yarn build:graphiql`, then run `CI=true yarn e2e`. The `CI` setting makes the test server serve the built app on port 8080.

## Clean and rebuild

`yarn build` reuses valid Turbo cache entries. To remove generated package outputs, extension bundles, and staged demos before building, run:

```sh
yarn build:rebuild
```

Cleaning preserves installed dependencies, source files, and the Turbo cache. To re-execute build tasks instead of restoring cached outputs, run:

```sh
yarn build:rebuild --force
```

`yarn build:clean` only removes generated artifacts. `yarn build-clean` is a compatibility alias. `yarn build-bundles-clean` removes extension bundles and staged demos while preserving compiled packages.

## CI caching

GitHub Actions saves `.turbo/cache` between jobs and runs. Cache archives are grouped by runner OS, architecture, Node version file, and lockfile. Turbo checks each task's inputs before restoring its outputs; tasks with changed inputs run again. Jobs also build successfully when no cache is available.

The release workflow saves caches on `main` that pull requests can reuse. Caches created by a pull request are available to later runs of that same pull request. GitHub controls this [cache access](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#restrictions-for-accessing-a-cache).

This uses GitHub's cache storage and requires no Vercel account or Turbo credentials. Turbo still reports `Remote caching disabled` because GitHub restores its local cache directory before the command runs. Developer machines keep their own local caches.

To check reuse, rerun a completed PR workflow with **Re-run all jobs**. Look for a restored cache in the **Turbo cache** step and cached tasks in Turbo's summary. An empty or evicted cache makes the run slower but should not change its result.

## Build extension bundles and demos

Build the VS Code extension bundles into their `out` directories:

```sh
yarn build-bundles
```

Build and stage the registered webpack demos for the GraphiQL site:

```sh
yarn build-demo
```

Turbo builds each demo's dependencies first. Staging replaces the demo's directory under `packages/graphiql` on every run, including when the example build comes from cache. The CDN and CM6 example directories aren't registered workspaces and aren't included in this command.
