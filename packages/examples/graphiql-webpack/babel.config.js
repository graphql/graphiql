module.exports = {
  sourceMaps: true,
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: 'latest 2 versions',
        modules: false,
      },
    ],
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('@babel/plugin-syntax-dynamic-import'),
    require.resolve('@babel/plugin-proposal-class-properties'),
  ],
};
