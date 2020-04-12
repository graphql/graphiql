const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isHMR = Boolean(isDev && process.env.WEBPACK_DEV_SERVER);

const relPath = (...args) => path.resolve(__dirname, ...args);
const rootPath = (...args) => relPath('../', ...args);

const resultConfig = {
  mode: process.env.NODE_ENV,
  entry: isHMR
    ? [
        'react-hot-loader/patch', // activate HMR for React
        'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
        'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
        './cdn.ts', // the entry point of our app
      ]
    : './cdn.ts',
  context: rootPath('src'),
  output: {
    path: rootPath(),
    library: 'GraphiQL',
    libraryTarget: 'window',
    libraryExport: 'default',
    filename: isDev ? 'graphiql.js' : 'graphiql.min.js',
  },
  devServer: {
    hot: true,
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.example.com', 'graphiql.com'],
    before: require('../test/beforeDevServer'),
  },
  devtool: isDev ? 'cheap-module-eval-source-map' : 'source-map',
  node: {
    fs: 'empty',
    module: 'empty',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
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
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: isHMR,
            },
          },
          'css-loader',
          'postcss-loader',
        ],
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
      template: relPath('index.html.ejs'),
      inject: 'head',
      filename: isDev && !isHMR ? 'dev.html' : 'index.html',
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: isDev ? 'graphiql.css' : 'graphiql.min.css',
      chunkFilename: '[id].css',
    }),
    new ForkTsCheckerWebpackPlugin({
      async: isDev,
      tsconfig: rootPath('tsconfig.json'),
    }),
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.json', '.jsx', '.css', '.ts', '.tsx'],
    modules: [rootPath('node_modules'), rootPath('../', '../', 'node_modules')],
  },
};

const cssLoaders = [
  {
    loader: MiniCssExtractPlugin.loader,
    options: {
      hmr: isHMR,
    },
  },
  'css-loader',
];

if (!isDev) {
  cssLoaders.push('postcss-loader');
}

resultConfig.module.rules.push();

if (process.env.ANALYZE) {
  resultConfig.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: rootPath('analyzer.html'),
    }),
  );
}

module.exports = resultConfig;
