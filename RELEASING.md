# Cutting New Releases

We chose a manual process which is pretty simple and flexible because of our conventional commit messages.

If you have NPM privileges, you have the ability to cut new releases of the packages herein.

## Requirements

You'll need:

- `GH_TOKEN` : a github user token as an environment variable
- `git` command line installed, obviously!
- to run `yarn login` first to ensure you're authenticated for publishing
- your npm 2FA should be enabled, and you should have your second factor device handy for publish
- your remote should be named `origin` for github, and should be the ssh url
- (coming soon) GPG key uploaded to account for signing

Note: Always publish from `master`. Always execute `yarn test` beforehand, and check the `examples/graphiql-webpack` to ensure there aren't any webpack build bugs.

## Prereleases

```sh
lerna publish --conventional-prerelease graphiql --otp <your-otp>
```

for a specific package, or leave blank for all packages.

It will automatically generate pre-release versions that reflect the conventional pattern from the commit log - so some packages may end up pre-alpha, others may be pre-minor, etc.

For example, if you made a change to `graphql-language-service-utils` there would be a new version for every single package. But if you made a change to `graphiql` in the commits since the last publish, there should only be a new pre-release version for `graphiql` when you run this command.

You can also `--amend` a previous release upon publishing, overriding the previous git tags

## Graduating Prereleases

Now, after creating and publishing some pre-release versions, if you want to graduate them you can do so with a command that works in very much the same way as above.

```sh
lerna publish --conventional-graduate * --otp <your token>
```

Would graduate all pre-alphas to patch releases, pre-minors to minor releases, etc.

You can also give a comma seperated list of packages, or just a single one, as with `prereleases`

```sh
lerna publish --conventional-graduate codemirror-graphql --otp <your token>
```

## Full Releases

```sh
lerna publish --otp <your token>
```

Will automatically detect and generate changelog/etc with appropriate versions and entries for all subpackage, no need to supply package names or an asterisk
