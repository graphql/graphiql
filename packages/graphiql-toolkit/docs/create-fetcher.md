## Create Fetcher

a utility for generating a full-featured `fetcher` for GraphiQL including `@stream`, `@defer` `IncrementalDelivery`and `multipart` and subscriptions using `graphql-ws` or the legacy websockets protocol

under the hood, it uses [`graphql-ws`](https://www.npmjs.com/package/graphql-ws) client and [`meros`](https://www.npmjs.com/package/meros) which act as client reference implementations of the [GraphQL over HTTP Working Group Spec](https://github.com/graphql/graphql-over-http) specification, and the most popular transport spec proposals

### Setup

[`graphiql`](https://npmjs.com/package/graphiql) and thus `react` and `react-dom` should already be installed.

you'll need to install `@graphiql/toolkit`

```bash
npm install --save @graphiql/toolkit
```

```bash
yarn add @graphiql/toolkit
```

### Getting Started

We have a few flexible options to get you started with the client. It's meant to cover the majority of common use cases with a simple encapsulation.

#### Default HTTP/Multipart IncrementalDelivery Usage

Here's a simple example. In this case, a websocket client isn't even initialized, only http (with multipart `@stream` and `@defer` Incremental Delivery support of course!).

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

#### Adding `graphql-ws` websockets subscriptions

first you'll need to install `graphql-ws` as a peer dependency:

```bash
npm install --save graphql-ws
```

```bash
yarn add graphql-ws
```

Just by providing the `subscriptionUrl`, you can also generate a `graphql-ws` client. This client now supports both HTTP/Multipart Incremental Delivery for `@defer` and `@stream`, _and_ websockets subscriptions

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

You can further customize the `graphql-ws` implementation by creating a custom client instance and providing it as the `wsClient` parameter

### Options

#### `url` (_required_)

This is url used for all `HTTP` requests, and for schema introspection.

#### `subscriptionUrl`

This generates a `graphql-ws` client using the provided url. Note that a server must be compatible with the new `graphql-ws` subscriptions spec for this to work.

#### `wsClient`

provide your own subscriptions client. bypasses `subscriptionUrl`. In theory, this could be any client using any transport, as long as it matches `graphql-ws` `Client` signature.

#### `legacyWsClient` or `legacyClient`

provide a legacy subscriptions client using `subscriptions-transport-ws` protocol. bypasses `subscriptionUrl`. In theory, this could be any client using any transport, as long as it matches `subscriptions-transport-ws` `Client` signature.

#### `headers`

Pass headers to any and all requests

#### `fetch`

Pass a custom fetch implementation such as `isomorphic-fetch`

### Customization Examples

#### Custom `wsClient` Example using `graphql-ws`

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

(not recommended)

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
  legacyWsClient: new SubscriptionClient(subscriptionUrl),
});

export const App = () => <GraphiQL fetcher={fetcher} />;

ReactDOM.render(document.getElementByID('graphiql'), <App />);
```

you will need to install the client separately:

```bash
yarn add subscriptions-transport-ws
```

```bash
npm install --save subscriptions-transport-ws
```

and instantiate a client instance following their readme, and pass it as `legacyWsClient`.

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
