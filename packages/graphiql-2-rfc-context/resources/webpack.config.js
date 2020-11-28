const path = require('path');
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
  entry: {
    graphiql: './cdn.ts',
    'graphql.worker': './workers/graphql.worker.ts',
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker.js',
  },
  context: rootPath('src'),
  output: {
    path: isDev ? rootPath('bundle/dev') : rootPath('bundle/dist'),
    // library: 'GraphiQL',
    libraryTarget: 'window',
    // libraryExport: 'default',
    filename: '[name].js',
    globalObject: 'this',
    // filename: isDev ? 'graphiql.js' : 'graphiql.min.js',
  },
  devServer: {
    // hot: true,
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.example.com', 'graphiql.com'],
    before: require('../test/beforeDevServer'),
  },
  devtool: isDev ? 'cheap-module-source-map' : 'source-map',
  node: {
    fs: 'empty',
    module: 'empty',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  optimization: {
    splitChunks: { name: 'vendor' },
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
        test: /\.svg$/,
        use: [{ loader: 'svg-inline-loader' }],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader'],
      },
      {
        test: /\.css$/,
        include: rootPath('src'),
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
      {
        test: /\.css$/,
        include: rootPath('../../node_modules/monaco-editor'),
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    // in order to prevent async modules for CDN builds
    // until we can guarantee it will work with the CDN properly
    // and so that graphiql.min.js can retain parity
    new HtmlWebpackPlugin({
      template: relPath('index.html.ejs'),
      inject: 'head',
      filename: 'index.html',
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
    // TODO: reduces bundle size, but then we lose the JSON grammar
    // new webpack.IgnorePlugin({
    //   contextRegExp: /monaco-editor\/esm\/vs\/language\/css\/$/
    // })
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.json', '.jsx', '.css', '.ts', '.tsx'],
    modules: [rootPath('node_modules'), rootPath('../', '../', 'node_modules')],
  },
};

const cssLoaders = [
  {
    loader: MiniCssExtractPlugin.loader,
  },
  'css-loader',
];

if (!isDev) {
  cssLoaders.push('postcss-loader');
} else {
  // TODO: This worked, but somehow this ended up totally busted
  // resultConfig.plugins.push(new ErrorOverlayPlugin());
}

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

// const otherConfig =
// {
//   mode: process.env.NODE_ENV,
//   entry: {
//     'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
//     'json.worker': 'monaco-editor/esm/vs/language/json/json.worker.js',
//     'graphql.worker': 'monaco-graphql/esm/graphql.worker.js',
//   },
//   output: {
//     path: isDev ? rootPath('build') : rootPath('bundle'),
//     filename: '[name].js',
//     globalObject: 'self',
//   },
//   node: {
//     fs: 'empty',
//     module: 'empty',
//   },
//   module: {
//     rules: [
//       // for graphql module, which uses .mjs
//       {
//         type: 'javascript/auto',
//         test: /\.mjs$/,
//         use: [],
//         include: /node_modules/,
//         exclude: /\.(ts|d\.ts|d\.ts\.map)$/,
//       },
//       // i think we need to add another rule for
//       // codemirror-graphql esm.js files to load
//       {
//         test: /\.(js|jsx|ts|tsx)$/,
//         use: [{ loader: 'babel-loader' }],
//         exclude: /\.(d\.ts|d\.ts\.map|spec\.tsx)$/,
//       },

//       {
//         test: /\.svg$/,
//         use: [{ loader: 'svg-inline-loader' }],
//       },
//       {
//         test: /\.(woff|woff2|eot|ttf|otf)$/,
//         use: ['file-loader'],
//       },
//       {
//         test: /\.css$/,
//         use: ['style-loader', 'css-loader'],
//       },
//     ],
//   },
//   plugins: [
//     new ForkTsCheckerWebpackPlugin({
//       async: isDev,
//       tsconfig: rootPath('tsconfig.json'),
//     }),
//   ],
// }
