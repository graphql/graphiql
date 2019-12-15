const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  entry: isDev
    ? [
        'react-hot-loader/patch', // activate HMR for React
        'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
        'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
        './index.jsx', // the entry point of our app
      ]
    : './index.jsx',
  context: path.resolve(__dirname, './src'),
  mode: 'development',
  devtool: 'inline-source-map',
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['file?name=[name].[ext]'],
      },
      // for graphql module, which uses mjs still
      {
        type: 'javascript/auto',
        test: /\.mjs$/,
        use: [],
        include: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { modules: false }],
                '@babel/preset-react',
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: [{ loader: 'svg-inline-loader' }],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.css', '.mjs'],
  },
  plugins: [new HtmlWebpackPlugin({ template: 'index.html.ejs' })],
  devServer: {
    hot: true,
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.test.com', 'graphiql.com'],
  },
  node: {
    fs: 'empty',
  },
};
