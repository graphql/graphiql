
module.exports = {
  sourceMaps: true,
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        "modules": process.env.ESM ? false : "commonjs"
      }
    ],
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),

  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'), 
    require.resolve('@babel/plugin-syntax-dynamic-import')
  ],
  env: {
    test: {
      // jest needs this:
      // https://github.com/zeit/next.js/issues/5416#issuecomment-511938775
      plugins: [require.resolve('babel-plugin-dynamic-import-node')]
    }
  }
};
