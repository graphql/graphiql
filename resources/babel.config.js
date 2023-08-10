module.exports = {
  sourceMaps: true,
  presets: [
    [require.resolve('@babel/preset-env'), { modules: false }],
    require.resolve('@babel/preset-react'),
  ],
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
};
