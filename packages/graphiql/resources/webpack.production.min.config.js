const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const DynamicCdnWebpackPlugin = require('dynamic-cdn-webpack-plugin');
const path = require('path')
const webpack = require('webpack')

const config = require('./webpack.shared.config')

/** 
 * Bundle it all into one file, no externals, no chunks
 */
module.exports = {
  ...config,
  entry: "./index.jsx",
  mode: "production",
  output: {
    ...config.output,
    // publicPath: '/bundle/', // CDN (always HTTPS)
    // publicPath: 'https://unpkg.com/graphiql/bundle/', // CDN (always HTTPS)
    path:  path.join(__dirname, '../'),
    filename: 'graphiql.min.js'
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  plugins: [
    ...config.plugins,
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: path.join(__dirname, '../coverage/analyzer/min/index.html')
    })
  ],
};
