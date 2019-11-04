const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const resultConfig = {
  entry: './index.jsx',
  context: path.resolve(__dirname, '../src'),
  output: {
    path: path.join(__dirname, '../bundle'),
    library: 'GraphiQL',
    libraryTarget: 'window',
    libraryExport: 'default',
    filename: 'graphiql.[name].min.js',
  },
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
      },
      // i think we need to add another rule for
      // codemirror-graphql esm.js files to load
      {
        test: /\.(js|jsx)$/,
        use: [{ loader: 'babel-loader', options: require('../babel.config') }],
      }
    ],
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.css', '.mjs'],
    alias: {
      graphiql: path.resolve(__dirname, '../bundle/main'),
    },
  },
};

if (process.env.ANALYZE) {
  resultConfig.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: path.join(__dirname, '../coverage/analyzer/index.html'),
    })
  );
}

module.exports = resultConfig;
