/* example using https://github.com/awslabs/aws-serverless-express */
const express = require('express');
 
const { graphqlHTTP } = require('express-graphql');
const awsServerlessExpress = require('aws-serverless-express');
const schema = require('../packages/graphiql/test/schema');
const cors = require('cors');

const binaryMimeTypes = [
  'application/javascript',
  'application/json',
  'font/eot',
  'font/opentype',
  'font/otf',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'text/css',
  'text/html',
  'text/javascript',
  'multipart/mixed',
];

const app = express();

app.use(cors({ origin: '*' }));

// Requests to /graphql redirect to /
app.all('/graphql', (req, res) => res.redirect('/'));

// Finally, serve up the GraphQL Schema itself
app.use(
  '/',
  graphqlHTTP(() => ({ schema })),
);

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

exports.handler = (event, context) =>
  awsServerlessExpress.proxy(server, event, context);

// // Server
// app.post('/graphql', graphqlHTTP({ schema }));

// app.get('/graphql', graphQLMiddleware);
// // Export Lambda handler

// exports.handler = serverless(app, {
//   httpMethod: 'POST'
// })
