# Contributing

We want to make contributing to this project as easy and transparent as
possible. Hopefully this document makes the process for contributing clear and
answers any questions you may have. If not, feel free to open an
[Issue](https://github.com/graphql/graphiql/issues).

## Issues

We use GitHub issues to track public bugs and requests. Please ensure your bug
description is clear and has sufficient instructions to be able to reproduce the
issue. The best way is to provide a reduced test case on jsFiddle or jsBin.

## Pull Requests

All active development of this project happens on GitHub. We actively welcome
your [pull requests](https://help.github.com/articles/creating-a-pull-request).

### Considered Changes

Since GraphiQL and related tools are used by a wide range of companies,
individuals and other projects, changes which are of obvious benefit are
prioritized and changes which are specific to only some usage of GraphiQL
should first consider if they may use the existing customization hooks or if
they should expose a new customization hook.

### Getting Started

1. Fork this repo by using the "Fork" button in the upper-right

2. Check out your fork

   ```sh
   git clone git@github.com:yournamehere/graphiql.git
   ```

3. Install or Update all dependencies

   ```sh
   yarn
   ```

4. Get coding! If you've added code, add tests. If you've changed APIs, update
   any relevant documentation or tests. Ensure your work is committed within a
   feature branch.

5. Ensure all tests pass

   ```sh
   yarn test
   ```

## Commit Message Conventions

Our commit messages are linted by `commitlint` following the angular changelog convention. You may end up losing a commit message or two if you don't follow this rule. We can add a prompt if people ask for it. This was designed for compatiblity with various git clients.

## Releasing

Please see [the RELEASING.md document](./RELEASING.md).

## License

By contributing to GraphiQL, you agree that your contributions will be
licensed under the LICENSE file in the project root directory.
