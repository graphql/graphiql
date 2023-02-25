# Description

## Scripts invoked via `npm` and `pnpm run`

### `buildFlow.js`

For each `.js` file under `src`, creates a corresponding `.js.flow` file under
`dist`; these files are included in the published NPM packages, so that
codebases can consume the Flow types. This script is invoked via
`pnpm run build-flow` (and also `pnpm run build`).

### `buildJs.js`

Compiles `.js` files under `src` using Babel, writing the output to `dist`. This
script is invoked via `pnpm run build-js` (and also `pnpm run build`).

### `pretty.js`

Prettifies the code base, or tests that it is already prettified. This script is
invoked for these two purposes respectively via `pnpm run pretty` and
`pnpm run pretty-check` (and also `npm test`).

## Typescript Configs

`.build.*` - used for project references `.base.*` - used for extends for
downstream tsconfig files
