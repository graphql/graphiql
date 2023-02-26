### Getting Started

Please note that we require a signed GraphQL Specification Membership agreement
before landing a contribution. This is checked automatically when you open a PR.
If you have not signed the membership agreement (it's free), you will be
prompted by the EasyCLA bot. For more details, please see the
[GraphQL WG repo](https://github.com/graphql/graphql-wg/tree/main/membership).

0. First, you will need the latest `git`, `pnpm` 1.16, & `node` 12 or greater.
   macOS, Windows and Linux should all be supported as build environments.

_**Note:** None of the commands below will work with `npm`. Please use `pnpm` in
this repo._

1. Fork this repo by using the "Fork" button in the upper-right

2. Check out your fork

   ```sh
   git clone git@github.com:your-name-here/graphiql.git
   ```

3. Install or Update all dependencies

   ```sh
   pnpm
   ```

4. Build all interdependencies so the project you are working on can resolve
   other packages

   First you'll need —

   ```sh
   pnpm run build
   ```

   — or —

   ```sh
   pnpm run build:watch
   ```

   If you are focused on GraphiQL development, you can run —

   ```sh
   pnpm run start-graphiql
   ```

5. Get coding! If you've added code, add tests. If you've changed APIs, update
   any relevant documentation or tests. Ensure your work is committed within a
   feature branch.

6. Ensure all tests pass, and build everything

   ```sh
   pnpm test
   ```

### Fix CI issues with linting

If you have `prettier` or `eslint --fix`-able issues you see in CI, use —

`pnpm format`

If you see `typescript` build issues, do a `pnpm build` locally, and make sure
the whole project references tree builds. Changing interfaces can end up
breaking their implementations.

### Run tests for GraphiQL:

- `pnpm test graphiql` will run all tests for graphiql. You can also run tests
  from a workspace, but most tooling is at the root.
- `pnpm test --watch` will run `jest` with `--watch`
- `pnpm e2e` at the root will run the end-to-end suite
- `pnpm start-monaco` will launch `webpack` dev server for the `monaco` editor
  example with GitHub API from the root. This is the fastest way to test changes
  to `graphql-language-service-interface`, parser, etc.

If you want these commands to watch for changes to dependent packages in the
repo, then run `pnpm build --watch` alongside either of these.

### Developing for GraphiQL

If you want to develop just for graphiql, you won't need to execute commands
from the package subdirectory at `packages/graphiql`.

First, you'll need to `pnpm build` all the packages from the root.

Then, you can run these commands:

- `pnpm start-graphiql` — which will launch `webpack` dev server for graphiql
  from the root

### Developing Monaco GraphQL

1. First run `pnpm` outside of workspace.
1. Then, run `pnpm tsc --watch` to watch `monaco-graphql` and
   `graphql-language-service` in one session/tab
1. In another session/tab, run `pnpm start-monaco` outside of a workspace
1. Alternatively to the webpack example, or in addition, you can run monaco or
   next.js examples, though these examples are simpler. They also require their
   own `pnpm` or `npm install` as they are excluded from the `workspaces`
   resolved on global `pnpm install`
