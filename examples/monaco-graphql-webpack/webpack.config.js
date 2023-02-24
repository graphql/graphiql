const path = require('node:path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const isDev = process.env.NODE_ENV === 'development';

const relPath = (...args) => path.resolve(__dirname, ...args);
const rootPath = (...args) => relPath(...args);

const resultConfig = {
  mode: process.env.NODE_ENV,
  entry: './index.ts',
  context: rootPath('src'),
  output: {
    path: rootPath('dist'),
    filename: '[name].js',
    chunkFormat: 'commonjs',
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
      {
        test: require.resolve('monaco-graphql/esm/graphql.worker.js'),
        use: {
          loader: 'worker-loader',
          options: {
            filename: 'graphql.worker.js',
          },
        },
      },
    ],
  },
  plugins: [
    // in order to prevent async modules for CDN builds
    // until we can guarantee it will work with the CDN properly
    // and so that graphiql.min.js can retain parity
    new HtmlWebpackPlugin({
      template: relPath('src/index.html.ejs'),
      filename: 'index.html',
    }),
    // critical! make sure that webpack can consume the exported modules and types
    new ForkTsCheckerWebpackPlugin({
      async: isDev,
      tsconfig: rootPath('tsconfig.json'),
    }),

    new MonacoWebpackPlugin({
      languages: ['json', 'graphql'],
      publicPath: '/',
      customLanguages: [
        {
          label: 'graphql',
          worker: {
            id: 'graphql',
            entry: require.resolve('monaco-graphql/esm/graphql.worker.js'),
          },
        },
      ],
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
