# GraphiQL CDN Example

This is a simple example of using **GraphiQL** directly from a CDN.

On the `graphiql-6` branch, it pins compatible GraphiQL 6 prerelease packages from [esm.sh](https://esm.sh). The page uses `transport` and configures Monaco workers from the versions published with `@graphiql/react`.

## Setup

No installation or build step is required. Serve the repository root and open `http://localhost:8000/examples/graphiql-cdn/`:

```sh
python3 -m http.server 8000
```

The CDN dependency update workflow runs against `main` only. After GraphiQL 6 becomes npm's `latest`, it regenerates this page with the new stable package versions. Until then, the checked-in prerelease page stays in place.

To regenerate the page manually with a published prerelease, pass its version to the generator (`beta` selects the current beta tag). The output is written to a temporary file so an unavailable CDN URL cannot truncate the checked-in example:

```sh
node .github/scripts/update-cdn-versions.mjs --graphiql-version 6.0.0-beta.3 > /tmp/graphiql-cdn.html && mv /tmp/graphiql-cdn.html examples/graphiql-cdn/index.html
```
