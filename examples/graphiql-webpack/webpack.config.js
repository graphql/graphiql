const { GenerateSW } = require('workbox-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const path = require('node:path');
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  entry: isDev
    ? [
        'react-hot-loader/patch', // activate HMR for React
        'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
        'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
        './src/index.jsx', // the entry point of our app
      ]
    : './src/index.jsx',
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
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.css', '.mjs'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'public' }],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '/index.html.ejs'),
    }),
    new GenerateSW(),
    new WebpackManifestPlugin({
      seed: {
        name: 'GraphiQL PWA',
        icons: [
          {
            src: 'logo.svg',
            sizes: '400x400',
          },
        ],
        start_url: './index.html',
        display: 'standalone',
        display_override: ['fullscreen', 'minimal-ui'],
        'logo.svg': 'auto/logo.svg',
      },
    }),
  ],
  devServer: {
    hot: true,
    // bypass simple localhost CORS restrictions by setting
    // these to 127.0.0.1 in /etc/hosts
    allowedHosts: ['local.test.com', 'graphiql.com'],
  },
};
