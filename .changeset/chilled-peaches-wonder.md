---
'@graphiql/react': patch
'monaco-graphql': patch
'graphql-language-service': minor
'graphiql': minor
---

feat(graphql-language-service): export `getContextAtPosition`
feat(graphiql): dynamically import `monaco-editor` and `monaco-graphql`

When using GraphiQL in Next.js app, you no longer need to use `next/dynamic`:

```diff
-import dynamic from 'next/dynamic'
-const GraphiQL = dynamic(() => import('graphiql').then(mod => mod.GraphiQL), {
-  ssr: false
-})
+import { GraphiQL } from 'graphiql'
```

When using GraphiQL with [React Router’s SSR mode](https://reactrouter.com/api/framework-conventions/react-router.config.ts#ssr),
you no longer need to mark the GraphiQL component as a [client module](https://reactrouter.com/api/framework-conventions/client-modules)
by adding `.client` to the file name.
