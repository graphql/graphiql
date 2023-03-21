### Getting Started

Please note that we require a signed GraphQL Specification Membership agreement
before landing a contribution. This is checked automatically when you open a PR.
If you have not signed the membership agreement (it's free), you will be
prompted by the EasyCLA bot. For more details, please see the
[GraphQL WG repo](https://github.com/graphql/graphql-wg/tree/main/membership).

0. First, you will need the latest `git`, `yarn` 1.16, & `node` 12 or greater.
   macOS, Windows and Linux should all be supported as build environments.

_**Note:** None of the commands below will work with `npm`. Please use `yarn` in
this repo._

1. Fork this repo by using the "Fork" button in the upper-right

2. Check out your fork

   ```sh
   git clone git@github.com:your-name-here/graphiql.git
   ```

3. Install or Update all dependencies

   ```sh
   yarn
   ```

4. Build all interdependencies so the project you are working on can resolve
   other packages

   First you'll need —

   ```sh
   yarn run build
   ```

   — or —

   ```sh
   yarn run build:watch
   ```

   If you are focused on GraphiQL development, you can run —

   ```sh
   yarn run start-graphiql
   ```

5. Get coding! If you've added code, add tests. If you've changed APIs, update
   any relevant documentation or tests. Ensure your work is committed within a
   feature branch.

6. Ensure all tests pass, and build everything

   ```sh
   yarn test
   ```

### Fix CI issues with linting

If you have `prettier` or `eslint --fix`-able issues you see in CI, use —

`yarn format`

If you see `typescript` build issues, do a `yarn build` locally, and make sure
the whole project references tree builds. Changing interfaces can end up
breaking their implementations.

### Run tests for GraphiQL:

- `yarn test graphiql` will run all tests for graphiql. You can also run tests
  from a workspace, but most tooling is at the root.
- `yarn test --watch` will run `jest` with `--watch`
- `yarn e2e` at the root will run the end-to-end suite
- `yarn start-monaco` will launch `webpack` dev server for the `monaco` editor
  example with GitHub API from the root. This is the fastest way to test changes
  to `graphql-language-service-interface`, parser, etc.

If you want these commands to watch for changes to dependent packages in the
repo, then run `yarn build --watch` alongside either of these.

### Developing for GraphiQL

If you want to develop just for graphiql, you won't need to execute commands
from the package subdirectory at `packages/graphiql`.

First, you'll need to `yarn build` all the packages from the root.

Then, you can run these commands:

- `yarn start-graphiql` — which will launch `webpack` dev server for graphiql
  from the root

> The GraphiQL UI is available at http://localhost:8080/dev.html

### Developing Monaco GraphQL

1. First run `yarn`.
2. run `yarn tsc --watch` to watch `monaco-graphql` and
   `graphql-language-service` in one screen session/terminal tab/etc
3. in another session, run `yarn start-monaco` from anywhere in the repository
   aside from an individual workspace.
4. alternatively to the webpack example, or in addition, you can run monaco or
   next.js examples, though these examples are simpler. They also require their
   own `yarn` or `npm install` as they are excluded from the `workspaces`
   resolved on global `yarn install`
