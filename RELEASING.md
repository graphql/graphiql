# Cutting New Releases

We chose a manual process which is pretty simple and flexible because of our conventional commit messages.

If you have NPM privileges, you have the ability to cut new releases of the packages herein.

## Requirements

You'll need:

- `GH_TOKEN` : a github user token as an environment variable
- `git` command line installed, obviously!
- to run `yarn adduser` first to ensure you're authenticated for publishing
- your npm 2FA should be enabled, and you should have your second factor device handy for publish
- your remote should be named `origin` for github, and should be the ssh url
- (coming soon) GPG key uploaded to account for signing

Note: Ideally we can avoid publishing from any branch but `master`, but we can always `--allow-branch mybranch` in case of an emergency for pre-releases. _Whenever you can, always publish from `master`_.

## Prereleases

```sh
yarn version:prerelease graphiql,codemirror-graphql
```

Or

```sh
yarn version:prerelease *
```

for all packages.

It will automatically create and prompt you for each of the pre-release versions that reflect the conventional pattern from the commit log - so some packages may end up pre-alpha, others may be pre-minor, etc.

For example, if you made a change to `graphql-language-service-utils` there would be a new version for every single package. But if you made a change to `graphiql` in the commits since the last publish, there should only be a new pre-release version for `graphiql` when you run this command.

You can also `--amend` a previous release before publishing.

Once this is complete, run `publish:prerelease` to complete this process, so that we can ensure we use pre-release tags. And then you'll of course authenticate again with your 2FA device.

## Graduating Prereleases

Now, after creating and publishing some pre-release versions, if you want to graduate them you can do so with a command that works in very much the same way as above.

```sh
yarn version:graduate *
```

Would graduate all pre-alphas to patch releases, pre-minors to minor releases, etc.

You can also give a comma seperated list of packages, or just a single one, as with `prereleases`

```sh
yarn version:graduate codemirror-graphql
```

then you can run

```sh
yarn run publish:graduate
```

And authenticate with 2FA

## Full Releases

```sh
yarn version:release
```

Will automatically detect and generate changelog/etc with appropriate versions and entries for all subpackage, no need to supply package names or an asterisk

Then you can run

```sh
lerna publish
```

And authenticate with 2FA
