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

The checked-in example uses the GraphiQL 6 release candidate. Regenerate it from the repository root with:

```sh
node .github/scripts/update-cdn-versions.mjs --graphiql-tag rc > examples/graphiql-cdn/index.html
```

`--graphiql-tag` selects the npm tag for `graphiql`, `@graphiql/react`, and `@graphiql/toolkit`. React, React DOM, and GraphQL use `latest`. Omit the option to use `latest` for every package once GraphiQL 6 is stable.
