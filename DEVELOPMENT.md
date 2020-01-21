### Getting Started

1. First, you will need to have the latest git, yarn 1.16 & node 12 or greater installed. OSX, Windows and Linux should all be supported as build environments.

**None of these commands will work with `npm`. Please use `yarn` to develop with graphql**.

1. Fork this repo by using the "Fork" button in the upper-right

2. Check out your fork

   ```sh
   git clone git@github.com:yournamehere/graphiql.git
   ```

3. Install or Update all dependencies

   ```sh
   yarn
   ```

4. Build all interdependencies so the project you are working on can resolve other packages

   ```sh
   yarn run build
   ```

5. Get coding! If you've added code, add tests. If you've changed APIs, update
   any relevant documentation or tests. Ensure your work is committed within a
   feature branch.

6. Ensure all tests pass, and build everything

   ```sh
   yarn test
   ```

### Developing for GraphiQL

If you want to develop just for graphiql, you don't even need to execute commands from the package subdirectory at `packages/graphiql`.

First, you'll need to `yarn build` all the packages from the root.

Then, you can run these commands:

- `yarn workspace graphiql dev` will launch webpack dev server for graphiql from the root
- `yarn workspace graphiql storybook` will launch graphiql storybook from the root

to run tests for GraphiQL:

- `yarn jest graphiql` will run all tests for graphiql
- `yarn jest --watch` will watch all changes in the monorepo

### All Commands

1. `yarn` - install and link all packages
2. `yarn build` - cleans first, then builds everything but webpack bundles - `tsc --build`, `babel` etc
3. `yarn build-bundles` - builds webpack bundles that are used for releases
4. `yarn build-demo` - builds demo projects for netlify; we run this on CI to make sure webpack can consume our project in a standalone project.
5. `yarn test` - runs `jest`. so `yarn t --watch`
6. `yarn format` - autoformats with eslint --fix and prettier
7. `yarn lint` - checks for linting issues
8. `yarn e2e` - runs cypress headlessly against the minified bundle and a local schema server, like in CI.
9. `yarn jest` - runs global jest commands across the entire monorepo; try `yarn test --watch` or `yarn jtest DocExplorer` for example :D
