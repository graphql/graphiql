import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import visualizer from 'rollup-plugin-visualizer';
import path from 'path';
import express from 'express';
const { graphqlHTTP } = require('express-graphql');
const schema = require('./test/schema');
const { schema: badSchema } = require('./test/bad-schema');
const Router = require('router');

export default defineConfig({
  plugins: [
    // reactRefresh(),
    // visualizer()
    {
      name: 'vite-plugin-test-server',
      configureServer(server) {
        const app = new Router();
        app.post('/graphql', graphqlHTTP({ schema }));

        app.post('/bad/graphql', (_req, res, next) => {
          res.json({ data: badSchema });
          next();
        });

        app.get(
          '/graphql',
          graphqlHTTP({
            schema,
          }),
        );

        app.use('/images', express.static(path.join(__dirname, 'images')));

        app.use(
          '/renderExample.js',
          express.static(path.join(__dirname, '../resources/renderExample.js')),
        );
        server.middlewares.use(app);
      },
    },
  ],
  css: {
    postcss: {
      file: path.resolve(__dirname, 'src/css'),
    } as any,
  },
});
