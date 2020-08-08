module.exports = {
  sourceMaps: true,
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: { browsers: ['last 2 chrome versions'] },
        bugfixes: true,
      },
    ],
    [require.resolve('@babel/preset-typescript'), {}],
  ],
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
};
