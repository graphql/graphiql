module.exports = {
  presets: [
    require.resolve("@babel/preset-env"), 
    require.resolve("@babel/preset-flow")
  ],
  plugins: [
    require.resolve("@babel/plugin-proposal-class-properties")
  ]
}
