# Usage GraphiQL with Vite, React Router and `ssr: true`

When using GraphiQL with [React Router’s SSR mode](https://reactrouter.com/api/framework-conventions/react-router.config.ts#ssr),
you need to mark the GraphiQL component as a [client module](https://reactrouter.com/api/framework-conventions/client-modules)
by adding `.client` to the file name.

```tsx
// graphiql.client.tsx
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({ url: 'https://my.backend/graphql' });

export const graphiql = <GraphiQL transport={transport} />;
```

```ts
// route.ts
import type { FC } from 'react';
import type { LinksFunction, MetaFunction } from 'react-router';
import graphiqlStyles from 'graphiql/style.css?url';
import { graphiql } from './graphiql.client';

export const meta: MetaFunction = () => {
  return [{ title: 'API Explorer' }];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: graphiqlStyles }];
};

const Route: FC = () => {
  return graphiql;
};

export default Route;
```

## Setup

1. `yarn dev` to start Vite dev server.
1. `yarn build` to build production ready transpiled files. Find the output in `dist` folder.
