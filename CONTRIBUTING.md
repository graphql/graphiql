# Contributing

We welcome contributions and assistance! If you want to know where to start,
check out our
[Github Projects sorted by name](https://github.com/graphql/graphiql/projects?query=is%3Aopen+sort%3Aname-asc).

If you want to add a new feature, note that GraphiQL is eventually going to
support its own extension system, and we are rarely adding new features, so make
sure you submit feature requests with that in mind.

## Development

To get setup for development, refer to [DEVELOPMENT.md](./DEVELOPMENT.md)

## Issues

We use GitHub issues to track public bugs and requests. Please ensure your bug
description is clear and has sufficient instructions to be able to reproduce the
issue. The best way is to provide a reduced test case on jsFiddle or jsBin.

## Pull Requests

All active development of this project happens on GitHub. We actively welcome
your [pull requests](https://help.github.com/articles/creating-a-pull-request).

### Type Prefixes

[a list of type prefixes](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum)
is available:

```json
[
  "build",
  "ci",
  "chore",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "style",
  "test"
]
```

of these, `fix` and `feat` can trigger patch and minor version releases,
reflexively. the rest are useful to help track activity.

another commit message that can trigger a major version bump is this:

```
feat: introduce new `fooBar()` API, break `foo()` api

- list changes

BREAKING CHANGE: break `foo()` api
```

notice the non breaking spaces between header and footer.

## Releasing

Please see [the RELEASING.md document](./RELEASING.md).

## License

By contributing to GraphiQL, you agree that your contributions will be licensed
under the LICENSE file in the project root directory.
