## Create Fetcher

a utility for generating a full-featured `fetcher` for GraphiQL including `@stream`, `@defer` `IncrementalDelivery`and `multipart`

under the hood, it uses [`graphql-ws`](https://www.npmjs.com/package/graphql-ws) and [`meros`](https://www.npmjs.com/package/meros) which act as client reference implementations of the [GraphQL over HTTP Working Group Spec](https://github.com/graphql/graphql-over-http) specification, and the most popular transport spec proposals

### Setup

[`graphiql`](https://npmjs.com/package/graphiql) and thus `react` and `react-dom` should already be installed.

you'll need to install `@graphiql/toolkit`

npm

```bash
npm install --save @graphiql/toolkit
```

yarn

```bash
yarn add @graphiql/toolkit
```

### Getting Started

We have a few flexible options to get you started with the client. It's meant to cover the majority of common use cases with a simple encapsulation.

#### HTTP/Multipart Usage

Here's a simple example. In this case, a websocket client isn't even initialized, only http (with multipart `@stream` and `@defer` support of course!).

```ts
import * as React from 'react';
import ReactDOM from 'react-dom';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://myschema.com/graphql';

const fetcher = createGraphiQLFetcher({ url });

export const App = () => <GraphiQL fetcher={fetcher} />;

ReactDOM.render(document.getElementByID('graphiql'), <App />);
```

#### HTTP/Multipart & Websockets

Just by providing the `subscriptionUrl`, you can generate a `graphql-ws` client

```ts
import * as React from 'react';
import ReactDOM from 'react-dom';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://myschema.com/graphql';

const subscriptionUrl = 'wss://myschema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  subscriptionUrl,
});

export const App = () => <GraphiQL fetcher={fetcher} />;

ReactDOM.render(document.getElementByID('graphiql'), <App />);
```

You can further customize the `wsClient` implementation below

### Options

#### `url` (_required_)

This is url used for all `HTTP` requests, and for schema introspection.

#### `subscriptionUrl`

This generates a `graphql-ws` client using the provided url. Note that a server must be compatible with the new `graphql-ws` subscriptions spec for this to work.

#### `wsClient`

provide your own subscriptions client. bypasses `subscriptionUrl`. In theory, this could be any client using any transport, as long as it matches `graphql-ws` `Client` signature.

#### `legacyClient`

provide a legacy subscriptions client. bypasses `subscriptionUrl`. In theory, this could be any client using any transport, as long as it matches `subscriptions-transport-ws` `Client` signature.

#### `headers`

Pass headers to any and all requests

#### `fetch`

Pass a custom fetch implementation such as `isomorphic-feth`

### Customization Examples

#### Custom `wsClient` Example

Just by providing the `wsClient`

```ts
import * as React from 'react';
import ReactDOM from 'react-dom';
import { GraphiQL } from 'graphiql';
import { createClient } from 'graphql-ws';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://myschema.com/graphql';

const subscriptionUrl = 'wss://myschema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  wsClient: createClient({
    url: subscriptionUrl,
    keepAlive: 2000,
  }),
});

export const App = () => <GraphiQL fetcher={fetcher} />;

ReactDOM.render(document.getElementByID('graphiql'), <App />);
```

#### Custom `legacyClient` Example

By providing the `legacyClient` you can support a `subscriptions-transport-ws` client implementation, or equivalent

```ts
import * as React from 'react';
import ReactDOM from 'react-dom';
import { GraphiQL } from 'graphiql';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://myschema.com/graphql';

const subscriptionUrl = 'wss://myschema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  legacyClient: new SubscriptionsClient(subscriptionUrl),
});

export const App = () => <GraphiQL fetcher={fetcher} />;

ReactDOM.render(document.getElementByID('graphiql'), <App />);
```

#### Custom `fetcher` Example

For SSR, we might want to use something like `isomorphic-fetch`

```ts
import * as React from 'react';
import ReactDOM from 'react-dom';
import { GraphiQL } from 'graphiql';
import { fetch } from 'isomorphic-fetch';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const url = 'https://myschema.com/graphql';

const fetcher = createGraphiQLFetcher({
  url,
  fetch,
});

export const App = () => <GraphiQL fetcher={fetcher} />;

ReactDOM.render(document.getElementByID('graphiql'), <App />);
```

## Credits

This is originally inspired by `graphql-subscriptions-fetcher` created by @Urigo
