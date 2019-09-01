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
   yarn
   ```

4. Get coding! If you've added code, add tests. If you've changed APIs, update
   any relevant documentation or tests. Ensure your work is committed within a
   feature branch.

5. Ensure all tests pass

   ```sh
   npm test
   ```

## Commit Message Conventions

Our commit messages are linted by `commitlint` following the angular changelog convention. You may end up losing a commit message or two if you don't follow this rule. We can add a prompt if people ask for it. This was designed for compatiblity with various git clients.

## Cutting New Releases

If you have NPM privileges, you have the ability to cut new releases of the packages herein.

Because of semantic versioning, this is a relatively easy process.

### Requirements

You'll need:
- `GH_TOKEN` : a github user token as an environment variable
- `git` command line installed, obviously!
- to run `yarn adduser` first to ensure you're authenticated for publishing
- your remote should be named `origin` for github, and should be the ssh url
- (coming soon) GPG key uploaded to account for signing

Note: Ideally we can avoid publishing from any branch but `master`, but we can always `--allow-branch mybranch` in case of an emergency for pre-releases.

### Prereleases

```sh
yarn version:prerelease graphiql,codemirror-graphql
```

Or

```sh
yarn version:prerelease *
```

for all packages.

It will automatically create and prompt you for eacho of the pre-release versions that reflect the conventional pattern from the commit log - so some packages may end up prealpha, others may be preminor, etc.

For example, if you made a change to `graphql-language-service-utils` there would be a new version for every single package. But if you made a change to `graphiql` in the commits since the last publih, there should only be a new pre-release version for `graphiql` when you run this command.

You can also `--amend` a previous release before publishing, if you wanted the changelog/etc entries to update and for it to re-run everything on the same version bump attempt.

Once this is complete, run `publish:prerelease` to complete this process, so that we can ensure we use pre-release tags.


### Graduating Prereleases

Now, after creating and publishing some pre-release versions, if you want to graduate them you can do so with a command that works in very much the same way as above.

```sh
yarn version:graduate *
```

Would graduate all pre-alphas to patch releases, pre-minors to minor releases, etc.
`lerna publish` or `yarn run publish:graduate` will both be suitable here.

You can also give a comma seperated list of packages, or just a single one, as with `prereleases`

```sh
yarn version:graduate codemirror-graphql
```

then you can run

```sh
yarn publish:graduate
```

### Full Releases


## License

By contributing to GraphiQL, you agree that your contributions will be
licensed under the LICENSE file in the project root directory.
