# GraphiQL CDN Example

This is a simple example of using **GraphiQL** directly from a CDN.

It loads GraphiQL from [esm.sh](https://esm.sh), an ESM-based CDN that serves npm packages as ES modules.

## Setup

No installation or build step is required. Serve the example from the repository root so its Monaco workers can load:

```sh
python3 -m http.server 8000 --directory examples/graphiql-cdn
```

Open [the example](http://localhost:8000/) in your browser.

## Update dependencies

After GraphiQL 6 and its companion packages are published under npm's `latest` tag, regenerate the example from the repository root:

```sh
node .github/scripts/update-cdn-versions.mjs > examples/graphiql-cdn/index.html
```

The generator resolves published versions, downloads the CDN modules and stylesheet, and computes their integrity hashes. Commit the generated version URLs and hashes together; changing URLs alone leaves the hashes invalid.

Serve the regenerated example with the command above, then verify that a query runs, editor completion and formatting work, and the browser console has no worker, module-loading, or integrity errors.

For prerelease testing, pass `--graphiql-tag rc`. The option selects the npm tag for `graphiql`, `@graphiql/react`, and `@graphiql/toolkit`; React, React DOM, and GraphQL still use `latest`.
