module.exports = {
  sourceMaps: true,
  presets: [
    [require.resolve('@babel/preset-env')],
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-transform-class-static-block'),
  ],
};
