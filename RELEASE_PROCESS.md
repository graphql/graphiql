# GraphiQL Monorepo Release Process

This document should guide you through doing a release of GraphiQL. Much of
the release process is automated, so just follow this process through and
everything should go smoothly!

Note: we run all `lerna` commands with `npx lerna` to ensure that we're using
the local copy, not a globally installed copy that might be out-of-sync with
our local copy.

## Step 0: see what would change

1. `npx lerna changed --long --toposort`

Ref: [lerna changed](https://github.com/lerna/lerna/tree/master/commands/changed)

## Step 1: cut a version

1. Run `npx lerna version` and choose which version to go to for each package
2. `git push && git push --tags` to push tags to GitHub
3. Update changelogs _(TODO: what command pulls in the conventional changelog?)_

Ref: [lerna version](https://github.com/lerna/lerna/tree/master/commands/version)

## Step 2: publish to npm

We always publish to the `next` tag on npm (i.e. to install you'd do
`npm install graphiql@next`) so we can test releases in-situ before making
them official. This is handled automatically (via `lerna.json`'s
`publish.distTag` setting).

**NOTE**: you should only publish from the `master` branch.

1. `npx lerna publish from-package` to release unreleased packages (you'll need
   to enter your OTP; please ensure it has the full 30 seconds left)
2. If publish fails part way through for 2FA/OTP reasons, just run step 1 again

Ref: [lerna publish](https://github.com/lerna/lerna/tree/master/commands/publish)

## Step 3: test that everything went well

This step left as an exercise for the reader ;)

(Pull down the latest `graphiql@next` or related package into your
application and test everything worked as expected.)

## Step 4: promote the release to official

Since we release to the `@next` tag; when we're ready we need to promote the
releases to `@latest`; you can do so with the handly script:

1. `./next2latest` (you will be asked for your OTP)
2. If this fails part way through for 2FA/OTP reasons, just run step 1 again

## Well done!

Congratulations - you've released the latest versions of the GraphiQL suite!
Now go tell everyone about it ;)
