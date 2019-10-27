const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const DynamicCdnWebpackPlugin = require('dynamic-cdn-webpack-plugin');
const path = require('path')
const webpack = require('webpack')

const config = require('./webpack.shared.config')

module.exports = {
  ...config,
  mode: "production",
  output: {
    ...config.output,
   // publicPath: 'https://unpkg.com/graphiql/bundle/', // CDN (always HTTPS)
    // publicPath: 'bundle/', // CDN (always HTTPS)
    path:  path.join(__dirname, '../bundle')
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
        },
        lazy: {
          name: "lazy",
          chunks: "async",
        }
      },
    },
  },
  plugins: [
    ...config.plugins,
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: path.join(__dirname, '../coverage/analyzer/unpkg/index.html')
    }),
    new HtmlWebpackPlugin({
      template: '../resources/index.bundle.html.ejs'
    }),
  ],
};
