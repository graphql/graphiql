# `createGraphiQLFetcher`

A utility for generating a full-featured `fetcher` for GraphiQL including
`@stream`, `@defer` `IncrementalDelivery`and `multipart` and subscriptions using
`graphql-ws` or the legacy websockets protocol.

Under the hood, it uses [`graphql-ws`](https://www.npmjs.com/package/graphql-ws)
client and [`meros`](https://www.npmjs.com/package/meros) which act as client
reference implementations of the
[GraphQL over HTTP Working Group Spec](https://github.com/graphql/graphql-over-http)
specification, and the most popular transport spec proposals.

## Setup

You can install `@graphiql/toolkit` using your favorite package manager:

```bash
npm install --save @graphiql/toolkit
```

## Getting Started

We have a few flexible options to get you started with the client. It's meant to
cover the majority of common use cases with a simple encapsulation.

### Default HTTP/Multipart IncrementalDelivery Usage

Here's a simple example. In this case, a websocket client isn't even
initialized, only http (with multipart `@stream` and `@defer` Incremental
Delivery support of course!).

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://my-schema.com/graphql';

const fetcher = createGraphiQLFetcher({ url });

export const App = () => <GraphiQL fetcher={fetcher} />;

const root = createRoot(document.getElementById('graphiql'));
root.render(<App />);
```

### Adding `graphql-ws` websockets subscriptions

First you'll need to install `graphql-ws` as a peer dependency:

```bash
npm install --save graphql-ws
```

Just by providing the `subscriptionUrl`, you can also generate a `graphql-ws`
client. This client now supports both HTTP/Multipart Incremental Delivery for
`@defer` and `@stream`, _and_ websockets subscriptions.

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://my-schema.com/graphql';

const subscriptionUrl = 'wss://my-schema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  subscriptionUrl,
});

export const App = () => <GraphiQL fetcher={fetcher} />;

const root = createRoot(document.getElementById('graphiql'));
root.render(<App />);
```

You can further customize the `graphql-ws` implementation by creating a custom
client instance and providing it as the `wsClient` parameter.

## Options

### `url` (_required_)

This is url used for all `HTTP` requests, and for schema introspection.

### `subscriptionUrl`

This generates a `graphql-ws` client using the provided url. Note that a server
must be compatible with the new `graphql-ws` subscriptions spec for this to
work.

### `wsClient`

Provide your own subscriptions client. Using this option bypasses
`subscriptionUrl`. In theory, this could be any client using any transport, as
long as it matches `graphql-ws` `Client` signature.

## `wsConnectionParams`

Provide your initial connection params.

```jsx
const fetcher = createGraphiQLFetcher({
  url: 'https://localhost:3000',
  subscriptionUrl: 'https://localhost:3001',
  wsConnectionParams: { Authorization: 'token 1234' },
});

const App = () => {
  return <GraphiQL fetcher={fetcher} />;
};
```

### `legacyWsClient` or `legacyClient`

Provide a legacy subscriptions client using `subscriptions-transport-ws`
protocol. Using this option bypasses `subscriptionUrl`. In theory, this could be
any client using any transport, as long as it matches
`subscriptions-transport-ws` `Client` signature.

### `headers`

Specify headers that will be passed to all requests.

### `fetch`

Pass a custom fetch implementation such as `isomorphic-fetch`.

## Customization Examples

### Custom `wsClient` Example using `graphql-ws`

This example passes a `graphql-ws` client to the `wsClient` option:

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { createClient } from 'graphql-ws';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://my-schema.com/graphql';

const subscriptionUrl = 'wss://my-schema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  wsClient: createClient({
    url: subscriptionUrl,
    keepAlive: 2000,
  }),
});

export const App = () => <GraphiQL fetcher={fetcher} />;

const root = createRoot(document.getElementById('graphiql'));
root.render(<App />);
```

### Custom `legacyClient` Example

(not recommended)

By providing the `legacyClient` you can support a `subscriptions-transport-ws`
client implementation, or equivalent:

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://my-schema.com/graphql';

const subscriptionUrl = 'wss://my-schema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  legacyWsClient: new SubscriptionClient(subscriptionUrl),
});

export const App = () => <GraphiQL fetcher={fetcher} />;

const root = createRoot(document.getElementById('graphiql'));
root.render(<App />);
```

Note that you will need to install the client separately:

```bash
npm install --save subscriptions-transport-ws
```

### Custom `fetcher` Example

For SSR, we might want to use something like `isomorphic-fetch`:

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { fetch } from 'isomorphic-fetch';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://my-schema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  fetch,
});

export const App = () => <GraphiQL fetcher={fetcher} />;

const root = createRoot(document.getElementById('graphiql'));
root.render(<App />);
```

## Credits

This is originally inspired by `graphql-subscriptions-fetcher` created by @Urigo
