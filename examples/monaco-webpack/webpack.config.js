const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isHMR = Boolean(isDev && process.env.WEBPACK_DEV_SERVER);

const relPath = (...args) => path.resolve(__dirname, ...args);
const rootPath = (...args) => relPath(...args);

const resultConfig = {
  mode: process.env.NODE_ENV,
  entry: isHMR
    ? [
        'react-hot-loader/patch', // activate HMR for React
        'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
        'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
        './index.ts', // the entry point of our app
      ]
    : './index.ts',
  context: rootPath('src'),
  output: {
    path: rootPath('build'),
    filename: 'monaco-graphql.js',
  },
  devServer: {
    hot: true,
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.example.com', 'monaco-graphql.com'],
  },
  devtool: isDev ? 'cheap-module-eval-source-map' : 'source-map',
  node: {
    fs: 'empty',
  },
  module: {
    rules: [
      // for graphql module, which uses .mjs
      {
        type: 'javascript/auto',
        test: /\.mjs$/,
        use: [],
        include: /node_modules/,
        exclude: /\.(ts|d\.ts|d\.ts\.map)$/,
      },
      // i think we need to add another rule for
      // codemirror-graphql esm.js files to load
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [{ loader: 'babel-loader' }],
        exclude: /\.(d\.ts|d\.ts\.map|spec\.tsx)$/,
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
        use: ['file-loader'],
      },
    ],
  },
  plugins: [
    // in order to prevent async modules for CDN builds
    // until we can guarantee it will work with the CDN properly
    // and so that graphiql.min.js can retain parity
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new HtmlWebpackPlugin({
      template: relPath('src/index.html.ejs'),
      inject: 'head',
      filename: 'index.html',
    }),
    new ForkTsCheckerWebpackPlugin({
      async: isDev,
      tsconfig: rootPath('tsconfig.json'),
    }),
    new MonacoWebpackPlugin({
      languages: ['json', 'graphql'],
    }),
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.json', '.jsx', '.css', '.ts', '.tsx'],
  },
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
