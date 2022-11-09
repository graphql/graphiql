### Getting Started

Please note that we require a signed GraphQL Specification Membership agreement
before landing a contribution. This is checked automatically when you open a PR.
If you have not signed the membership agreement (it's free), you will be
prompted by the EasyCLA bot. For more details, please see the
[GraphQL WG repo](https://github.com/graphql/graphql-wg/tree/main/membership).

1. First, you will need to have the latest git, yarn 1.16 & node 12 or greater
   installed. OSX, Windows and Linux should all be supported as build
   environments.

**None of these commands will work with `npm`. Please use `yarn` to develop with
graphql**.

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

   first you'll need

   ```sh
   yarn run build
   ```

   you can also use

   ```sh
   yarn run build:watch
   ```

   if you are focused on GraphiQL development, you can run

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

if you have prettier or eslint --fix able issues you see in CI, use yarn format:

`yarn format`

if you see typescript build issues, do a `yarn build` locally and make sure the
whole project references tree builds. changing interfaces can end up breaking
their implementations.

### Run tests for GraphiQL:

- `yarn test graphiql` will run all tests for graphiql. you can also run tests
  from a workspace, but most tooling is at the root.
- `yarn test --watch` will run jest with --watch
- `yarn e2e` at the root will run the end to end suite
- `yarn start-monaco` will launch webpack dev server for the monaco editor
  example with GitHub API from the root. this is the fastest way to test changes
  to `graphql-language-service-interface`, parser, etc.

if you want these commands to watch for changes to dependent packages in the
repo, then `yarn build --watch` is what you want to run alongside either of
these.

### Developing for GraphiQL

If you want to develop just for graphiql, you don't even need to execute
commands from the package subdirectory at `packages/graphiql`.

First, you'll need to `yarn build` all the packages from the root.

Then, you can run these commands:

- `yarn start-graphiql` will launch webpack dev server for graphiql from the
  root

### Developing Monaco GraphQL

Follow the
[`monaco-graphql` example readme](examples/monaco-graphql-webpack/README.md) to
set it up, and then you can run `yarn start-monaco` from anywhere in the
repository!
