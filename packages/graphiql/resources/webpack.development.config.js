const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.shared.config');
const isDev = process.env.NODE_ENV === 'development';

const finalConfig = {
  ...config,
  context: path.resolve(__dirname, '../test'),
  entry: isDev
    ? [
        'react-hot-loader/patch', // activate HMR for React
        'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
        'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
        './index.jsx', // the entry point of our app
      ]
    : './index.jsx',
  output: {
    ...config.output,
    path: path.resolve(path.join(__dirname, '../test/dist')),
  },
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.example.com', 'graphiql.com'],
  },
  mode: 'development',
  node: {
    fs: 'empty',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(path.join(__dirname, 'index.bundle.html.ejs')),
    }),
  ],
};

module.exports = finalConfig;
