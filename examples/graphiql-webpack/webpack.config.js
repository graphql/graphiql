const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const relPath = (...args) => path.resolve(__dirname, ...args);
const rootPath = (...args) => relPath(...args);

const resultConfig = {
  mode: process.env.NODE_ENV,
  entry: './index.jsx',
  context: rootPath('src'),
  output: {
    path: rootPath('dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      // you can also use ts-loader of course
      // i prefer to use babel-loader & @babel/plugin-typescript
      // so we can experiment with how changing browserslistrc targets impacts
      // monaco-graphql bundling
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: [{ loader: 'svg-inline-loader' }],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.json', '.jsx', '.css', '.ts', '.tsx'],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    // in order to prevent async modules for CDN builds
    // until we can guarantee it will work with the CDN properly
    // and so that graphiql.min.js can retain parity
    new HtmlWebpackPlugin({
      template: relPath('src/index.html.ejs'),
      filename: 'index.html',
    }),

    new MonacoWebpackPlugin({
      languages: ['json', 'graphql'],
      publicPath: '/',
      customLanguages: [
        {
          label: 'graphql',
          worker: {
            id: 'graphql',
            entry: 'monaco-graphql/esm/graphql.worker.js',
          },
        },
      ],
    }),
  ],
};

if (process.env.ANALYZE) {
  resultConfig.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: rootPath('build/analyzer.html'),
    }),
  );
}

module.exports = resultConfig;
