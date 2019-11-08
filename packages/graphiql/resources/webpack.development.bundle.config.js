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
    filename: 'graphiql.js',
  },
  plugins: [
    ...config.plugins,
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};

module.exports = resultConfig;
