module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: '> 0.25%, not dead',
      },
    ],
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
};
