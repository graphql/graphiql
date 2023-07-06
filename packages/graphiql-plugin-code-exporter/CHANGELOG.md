# @graphiql/plugin-code-exporter

## 0.2.0

### Minor Changes

- [#3293](https://github.com/graphql/graphiql/pull/3293) [`1b8f3fe9`](https://github.com/graphql/graphiql/commit/1b8f3fe9c41697855378ec13a76f1a908fda778a) Thanks [@B2o5T](https://github.com/B2o5T)! - BREAKING CHANGE: umd build was renamed to `index.umd.js`

## 0.1.4

### Patch Changes

- [#3292](https://github.com/graphql/graphiql/pull/3292) [`f86e4172`](https://github.com/graphql/graphiql/commit/f86e41721d4d990535253b579c810bc5e291b40b) Thanks [@B2o5T](https://github.com/B2o5T)! - fix umd build names `graphiql-plugin-code-exporter.umd.js` and `graphiql-plugin-explorer.umd.js`

## 0.1.3

### Patch Changes

- [#3229](https://github.com/graphql/graphiql/pull/3229) [`0a65e720`](https://github.com/graphql/graphiql/commit/0a65e7207b6bc4174896f6acca8a40f45d2fb1b8) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

- [#3251](https://github.com/graphql/graphiql/pull/3251) [`f8d8509b`](https://github.com/graphql/graphiql/commit/f8d8509b432803eaeb2e53b6b6d4321535e11c1d) Thanks [@B2o5T](https://github.com/B2o5T)! - always bundle `package.json#dependencies` for UMD build for `@graphiql/plugin-code-exporter` and `@graphiql/plugin-explorer`

- [#3236](https://github.com/graphql/graphiql/pull/3236) [`64da8c30`](https://github.com/graphql/graphiql/commit/64da8c3074628bb411eb1c28aa4738843f60910c) Thanks [@B2o5T](https://github.com/B2o5T)! - update vite

## 0.1.3-alpha.0

### Patch Changes

- [#3229](https://github.com/graphql/graphiql/pull/3229) [`0a65e720`](https://github.com/graphql/graphiql/commit/0a65e7207b6bc4174896f6acca8a40f45d2fb1b8) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

## 0.1.2

### Patch Changes

- [#3017](https://github.com/graphql/graphiql/pull/3017) [`4a2284f5`](https://github.com/graphql/graphiql/commit/4a2284f54809f91d03ba51b9eb4e3ba7b8b7e773) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid bundling code from `react/jsx-runtime` so that the package can be used with Preact

- [#3063](https://github.com/graphql/graphiql/pull/3063) [`5792aaa5`](https://github.com/graphql/graphiql/commit/5792aaa5b26b68dc396f7bfb5dc3defd9331b831) Thanks [@B2o5T](https://github.com/B2o5T)! - avoid `useMemo` with empty array `[]` since React can't guarantee stable reference, + lint restrict syntax for future mistakes

## 0.1.1

### Patch Changes

- [#2864](https://github.com/graphql/graphiql/pull/2864) [`f61a5574`](https://github.com/graphql/graphiql/commit/f61a55747a6ff3a125c54e2bf3512f8f4b8f4c50) Thanks [@LekoArts](https://github.com/LekoArts)! - chore(@graphiql/plugin-code-exporter): Fix Typo

## 0.1.0

### Minor Changes

- [#2758](https://github.com/graphql/graphiql/pull/2758) [`d63801fa`](https://github.com/graphql/graphiql/commit/d63801fad08e840eff7ff26f55694c6d18769466) Thanks [@LekoArts](https://github.com/LekoArts)! - Add code exported plugin
