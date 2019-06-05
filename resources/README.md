# Description

## Scripts invoked via `npm` and `yarn run`

### `buildFlow.js`

For each `.js` file under `src`, creates a corresponding `.js.flow` file under `dist`; these files are included in the published NPM packages, so that codebases can consume the Flow types. This script is invoked via `yarn run build-flow` (and also `yarn run build`).

### `buildJs.js`

Compiles `.js` files under `src` using Babel, writing the output to `dist`. This script is invoked via `yarn run build-js` (and also `yarn run build`).

### `checkDependencies.js`

Makes sure that packages don't depend on different versions of other packages, and that all development dependencies have been hoisted up from packages in the `packages` directory and into the main (top-level) `package.json` file. This script is invoked via `yarn run check-dependencies` (and also `npm test`).

### `prepublish.js`

This script is invoked via `yarn run prepublish`.

### `pretty.js`

Prettifies the code base, or tests that it is already prettified. This script is invoked for these two purposes respectively via `yarn run pretty` and `yarn run pretty-check` (and also `npm test`).

## Scripts invoked directly

### `bumpVersion.js`

Dependency-aware helper script for bumping a package version number. For example `resources/bumpVersion.js --patch types` will bump the "graphql-language-service-types" package from version "x.y.z" to "x.y.z+1", and also bump all the packages that depend on it (directly or transitively).

## Scripts invoked automatically

### `hoistDependencies.js`

Used by Travis CI (which only runs jobs at the top level) to hoist all dependencies up into the main `package.json`. Additionally, rewrites references from `dist` to `src` so that Flow can run locally and check types across all the packages in the repo. You shouldn't have to run this manually unless you want to do local Flow troubleshooting.
