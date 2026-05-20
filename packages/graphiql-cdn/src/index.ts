import * as GraphiQLReact from '@graphiql/react';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { createGraphiQLFetcher, createLocalStorage } from '@graphiql/toolkit';
import * as GraphQL from 'graphql';
import { GraphiQL, HISTORY_PLUGIN } from 'graphiql';
import 'graphiql/style.css';
import '@graphiql/plugin-explorer/style.css';
// Configure MonacoEnvironment with workers inlined as blob URLs, so the
// bundle can be loaded from a CDN onto pages of any origin.
import './setup-workers.js';

export {
  GraphiQL,
  HISTORY_PLUGIN,
  GraphiQLReact,
  GraphQL,
  createGraphiQLFetcher,
  createLocalStorage,
  explorerPlugin,
};

export default GraphiQL;
