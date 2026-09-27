# GraphiQL CDN example

This example loads the latest stable GraphiQL package family from [esm.sh](https://esm.sh) without a build step. Its import map shares one Monaco editor instance across GraphQL and JSON language features.

## Open the example

From the repository root, serve the example over HTTP:

```sh
python3 -m http.server 8000 --directory examples/graphiql-cdn
```

Open [the example](http://localhost:8000/) in your browser. It uses the Countries GraphQL endpoint. To use your own server or supply an initial query, add the `endpoint` and `query` URL parameters.

## Update dependencies

Generate the example from the latest stable package versions and refresh its integrity hashes:

```sh
node .github/scripts/update-cdn-versions.mjs > examples/graphiql-cdn/index.html
pnpm format
```

Serve the generated file and exercise query execution, formatting, completion, diagnostics, keyboard shortcuts, and the editor, JSON, and GraphQL workers in a native browser before committing it.
