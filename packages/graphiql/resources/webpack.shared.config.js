const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./index.jsx",
  context: path.resolve(__dirname, "../src"),
  output: {
    path:  path.join(__dirname, '../bundle'),
    library: 'GraphiQL',
    libraryTarget: 'window',
    libraryExport: 'default',
    filename: 'graphiql.[name].min.js'
  },
  node: {
    fs: "empty"
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["file?name=[name].[ext]"]
      },
      // for graphql module, which uses mjs still
      {
        type: "javascript/auto",
        test: /\.mjs$/,
        use: [],
        include: /node_modules/
      },
      {
        test: /\.esm.js$/,
        type: 'javascript/esm',
        include: /node_modules/
      },
      {
        test: /\.(js|jsx)$/,
        use: [{ loader: "babel-loader" }]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.svg$/,
        use: [{ loader: "svg-inline-loader" }]
      }
    ]
  },
  plugins: [],
  resolve: {
    extensions: [".js", ".json", ".jsx", ".css", ".mjs"],
    alias: {
      'graphiql': path.resolve(__dirname, '../bundle/main')
    }
  }
}
