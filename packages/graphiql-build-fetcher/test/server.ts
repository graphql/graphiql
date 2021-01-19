import https from 'https';
import ws from 'ws'; // yarn add ws
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import {
  execute,
  GraphQLObjectType,
  GraphQLString,
  subscribe,
  GraphQLSchema,
} from 'graphql';

const wait = (timeout: number = 200) =>
  new Promise(res => setTimeout(res, timeout));

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    streamExample: {
      type: GraphQLString,
      resolve: async function* sayHiInFiveLanguages() {
        for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
          yield { greetings: hi };
          await wait(500);
        }
      },
    },
  },
});

const Subscription = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    subscriptionExample: {
      type: GraphQLString,
      subscribe: async function* sayHiInFiveLanguages() {
        for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
          yield { greetings: hi };
          await wait(500);
        }
      },
    },
  },
});

try {
  const schema = new GraphQLSchema({
    subscription: Subscription,
    query: Query,
  });

  // create express and middleware
  const app = express();
  app.use('/graphql', graphqlHTTP({ schema, graphiql: true }));

  // create a http server using express
  const server = https.createServer(app);

  // create websocket server
  const wsServer = new ws.Server({
    server,
    path: '/graphql',
  });
  const port = process.env.PORT || 3000
  server.listen(port, () => {
    useServer(
      {
        schema,
        execute,
        subscribe,
        connectionInitWaitTimeout: 2000
      },
      wsServer,
    );
    console.log(`listening on ${port}`)
  });
} catch (err) {
  console.error(err);
}
