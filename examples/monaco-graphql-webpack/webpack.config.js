const path = require('path');

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
    globalObject: 'self',
  },
  devServer: {
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.example.com', 'monaco-graphql.com'],
  },
  devtool: isDev ? 'cheap-module-eval-source-map' : 'source-map',
  node: {
    fs: 'empty',
    module: 'empty',
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
    new HtmlWebpackPlugin({
      template: relPath('src/index.html.ejs'),
      filename: 'index.html',
    }),
    new ForkTsCheckerWebpackPlugin({
      async: isDev,
      tsconfig: rootPath('tsconfig.json'),
    }),

    new MonacoWebpackPlugin({
      languages: ['json'],
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
