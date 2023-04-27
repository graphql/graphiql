# @graphiql/plugin-code-exporter

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
