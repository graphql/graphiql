const path = require('path');
const webpack = require('webpack');

const config = require('./webpack.shared.config');

/**
 * Bundle it all into one file, no externals, no chunks
 */

const resultConfig = {
  ...config,
  mode: 'development',
  output: {
    ...config.output,
    // publicPath: '/bundle/', // CDN (always HTTPS)
    // publicPath: 'https://unpkg.com/graphiql/bundle/', // CDN (always HTTPS)
    path: path.join(__dirname, '../bundle/index'),
    filename: 'graphiql.js',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  plugins: [
    ...config.plugins,
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};

module.exports = resultConfig;
