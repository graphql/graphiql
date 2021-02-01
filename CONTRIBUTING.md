# Contributing

We welcome contributions and assistance! If you want to know where to start, check out our [Github Projects sorted by name](https://github.com/graphql/graphiql/projects?query=is%3Aopen+sort%3Aname-asc).

If you want to add a new feature, note that GraphiQL is eventually going to support its own extension system, and we are rarely adding new features, so make sure you submit feature requests with that in mind.

## Development

To get setup for development, refer to [DEVELOPMENT.md](./DEVELOPMENT.md)

## Issues

We use GitHub issues to track public bugs and requests. Please ensure your bug
description is clear and has sufficient instructions to be able to reproduce the
issue. The best way is to provide a reduced test case on jsFiddle or jsBin.

## Pull Requests and signing the membership agreement

All active development of this project happens on GitHub. We actively welcome
your [pull requests](https://help.github.com/articles/creating-a-pull-request).

This repository is managed by EasyCLA. Project participants must sign the free GraphQL Specification Membership agreement ([preview](https://foundation.graphql.org/files/GraphQL_Specification-Individual-Preview.pdf)) before making a contribution. You only need to do this one time.

You can either sign the document as an individual on your own behalf, or your company can do it. If your company has already signed the agreement, you will need to ask your CLA manager to add you to the [list of approved contributors](https://corporate.v1.easycla.lfx.linuxfoundation.org/). If you do not know your CLA manager, please email [operations@graphql.org](mailto:operations@graphql.org) for help.

To initiate the signature process please open a PR. The EasyCLA bot will block merging if we still need a membership agreement from you.

If you have issues, please email [operations@graphql.org](mailto:operations@graphql.org).

## Commit Message Conventions

Our commit messages are linted by `commitlint` following the angular changelog convention. You may end up losing a commit message or two if you don't follow this rule. We can add a prompt if people ask for it. This was designed for compatibility with various git clients in mind.

You will need to include a type prefix for all commit messages. For example:

`git commit -m 'fix: fix window undefined error in result viewer'`

### Type Prefixes

[a list of type prefixes](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum) is available:

```js
[
  'build',
  'ci',
  'chore',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
];
```

of these, `fix` and `feat` can trigger patch and minor version releases, reflexively. the rest are useful to help track activity.

another commit message that can trigger a major version bump is this:

```
feat: introduce new `fooBar()` API, break `foo()` api

- list changes

BREAKING CHANGE: break `foo()` api
```

notice the nonbreaking spaces between header and footer.

## Releasing

Please see [the RELEASING.md document](./RELEASING.md).

## License

By contributing to GraphiQL, you agree that your contributions will be
licensed under the LICENSE file in the project root directory.
