module.exports = {
  presets: [
    require.resolve('@babel/preset-env'),
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
};
