Contributing to GraphiQL
========================

We want to make contributing to this project as easy and transparent as
possible. Hopefully this document makes the process for contributing clear and
answers any questions you may have. If not, feel free to open an
[Issue](https://github.com/facebook/graphql/issues).

## Issues

We use GitHub issues to track public bugs and requests. Please ensure your bug
description is clear and has sufficient instructions to be able to reproduce the
issue. The best way is to provide a reduced test case on jsFiddle or jsBin.

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe
disclosure of security bugs. In those cases, please go through the process
outlined on that page and do not file a public issue.

## Pull Requests

All active development of GraphiQL happens on GitHub. We actively welcome
your [pull requests](https://help.github.com/articles/creating-a-pull-request).

### Considered Changes

Since GraphiQL is used both internally at Facebook and by a broad group
externally, changes which are of obvious benefit are prioritized and changes
which are specific to only some usage of GraphiQL should first consider if they
may use the existing customization hooks or if they should expose a new
customization hook.

### Contributor License Agreement ("CLA")

In order to accept your pull request, we need you to submit a CLA. You only need
to do this once to work on any of Facebook's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

### Getting Started

1. Fork this repo by using the "Fork" button in the upper-right

2. Check out your fork

   ```sh
   git clone git@github.com:yournamehere/graphiql.git
   ```

3. Install or Update all dependencies

   ```sh
   npm install
   ```

4. Get coding! If you've added code, add tests. If you've changed APIs, update
   any relevant documentation or tests. Ensure your work is committed within a
   feature branch.

5. Ensure all tests pass

   ```sh
   npm test
   ```

## Release on NPM

*Only core contributors may release to NPM.*

To release a new version on NPM, first ensure you're on the `master` branch and
have recently run `git pull` and that all tests pass with `npm test`.
Use `npm version patch|minor|major` in order to increment the version in
package.json and tag and commit a release. Then `git push --follow-tags`
this change so Travis CI can deploy to NPM. *Do not run `npm publish` directly.*
Once published, add [release notes](https://github.com/graphql/graphql-js/tags).
Use [semver](http://semver.org/) to determine which version part to increment.

Example for a patch release:

```sh
npm version patch
git push --follow-tags
```

## License

By contributing to GraphiQL, you agree that your contributions will be
licensed under the LICENSE file in the project root directory.
