const path = require('path');

const config = require('./webpack.shared.config');

module.exports = {
  ...config,
  mode: 'production',
  output: {
    ...config.output,
    publicPath: 'https://unpkg.com/browse/graphiql@latest',
    path: path.join(__dirname, '../bundle/lazy-unpkg'),
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  // these settings were interesting to experiment with
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'initial',
        },
      },
    },
  },
};
