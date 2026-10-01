# GraphiQL CDN Example

This is a simple example of using **GraphiQL** directly from a CDN.

It loads GraphiQL from [esm.sh](https://esm.sh), an ESM-based CDN that serves npm packages as ES modules.

## Setup

No installation or build step is required. Serve the example from the repository root so its Monaco workers can load:

```sh
python3 -m http.server 8000 --directory examples/graphiql-cdn
```

Open [the example](http://localhost:8000/) in your browser.
