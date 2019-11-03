const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = require('./webpack.shared.config');

/**
 * Bundle it all into one file, no externals, no chunks
 */

const resultConfig = {
  ...config,
  entry: './renderGraphiQL.js',
  mode: 'production',
  output: {
    ...config.output,
    path: path.join(__dirname, '../bundle/render'),
    library: 'renderGraphiQL',
    libraryTarget: 'window',
    libraryExport: 'default',
    filename: 'graphiql.render.min.js',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  plugins: [
    ...config.plugins,
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    })
  ]
};

module.exports = resultConfig;
