# GraphiQL with Next.js

This standalone example uses GraphiQL 6 and the Next.js App Router. It is independent of the repository's pnpm workspace.

Use Node.js 24, then install and start the example from this directory:

```sh
npm install
npm run dev
```

Open [the example](http://localhost:3000/). Edit [`src/app/graphiql.tsx`](./src/app/graphiql.tsx) to change the GraphQL endpoint or editor options.

The development and production commands use Webpack so GraphiQL's Monaco worker setup is preserved. The transport receives an explicit `fetch` implementation so the page can also render on the server.

Validate the example with:

```sh
npm run types:check
npm run build
npm start
```

The TypeScript dependency uses the classic compiler API required by Next.js. The scoped DOMPurify override updates Monaco's declared package dependency within the same major version.

Monaco 0.57.0 also embeds DOMPurify 3.4.15 in its distributed editor code. The package override does not replace that vendored copy; its sanitizer advisories require an upstream Monaco release containing [DOMPurify 3.4.17 or later](https://github.com/cure53/DOMPurify/releases/tag/3.4.17).
