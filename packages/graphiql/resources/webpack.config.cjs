const path = require('node:path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

const graphql = require('graphql');
const rimraf = require('rimraf');

const isDev = process.env.NODE_ENV === 'development';
// const isHMR = Boolean(isDev && process.env.WEBPACK_DEV_SERVER);

const relPath = (...args) => path.resolve(__dirname, ...args);
const rootPath = (...args) => relPath('../', ...args);

/**
 * @type {import('webpack').Configuration}
 */
const resultConfig = {
  mode: process.env.NODE_ENV,
  entry: './cdn.ts',
  context: rootPath('src'),
  output: {
    // iife: true,
    path: rootPath(),
    library: { name: 'GraphiQL', type: 'window', export: 'default' },
    filename: isDev ? 'graphiql.js' : 'graphiql.min.js',
  },
  devServer: {
    hot: true,
    // static: {
    //   directory: path.join(__dirname, '../'),
    // },

    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.example.com', 'graphiql.com', 'localhost'],
    onBeforeSetupMiddleware: ({ app }) =>
      require('../test/beforeDevServer')(app),
    onAfterSetupMiddleware: ({ app }) => require('../test/afterDevServer')(app),
  },
  devtool: isDev ? 'cheap-module-source-map' : 'source-map',
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },

  module: {
    rules: [
      // for graphql module, which uses .mjs
      // {
      //   type: 'javascript/auto',
      //   test: /\.mjs$/,
      //   use: [],
      //   include: /node_modules/,
      //   exclude: /\.(ts|d\.ts|d\.ts\.map)$/,
      // },

      // i think we need to add another rule for
      // codemirror-graphql esm.js files to load
      {
        test: /\.(js|mjs|cjs|jsx|ts|tsx)$/,
        use: [{ loader: 'babel-loader' }],
        exclude: [/\.(d\.ts|d\.ts\.map|spec\.tsx)$/, /\node_modules/],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.css$/,
        use: [{ loader: MiniCssExtractPlugin.loader }, 'css-loader'],
      },
      {
        test: /\.css$/,
        exclude: /graphiql-react/,
        use: ['postcss-loader'],
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
      filename: isDev ? 'dev.html' : 'index.html',
      graphqlVersion: JSON.stringify(graphql.version),
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: isDev ? 'graphiql.css' : 'graphiql.min.css',
      chunkFilename: '[id].css',
    }),
    new ForkTsCheckerWebpackPlugin({
      async: isDev,
      typescript: {
        configFile: rootPath('tsconfig.json'),
      },
    }),
    new (class {
      apply(compiler) {
        compiler.hooks.done.tap('Remove LICENSE', () => {
          console.log('Remove LICENSE.txt');
          rimraf.sync('./*.LICENSE.txt');
        });
      }
    })(),
  ],
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.json', '.jsx', '.css', '.ts', '.tsx'],
    plugins: [PnpWebpackPlugin],
  },
};

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
