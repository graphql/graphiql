module.exports = {
  presets: [
    require.resolve('@babel/preset-env'),
    [
      require.resolve('@babel/preset-typescript'),
      { onlyRemoveTypeImports: false },
    ],
    [
      require.resolve('@babel/preset-react'),
      { runtime: 'classic', development: false },
    ],
  ],
  plugins: [
    require.resolve('@babel/plugin-transform-class-properties'),
    require.resolve('@babel/plugin-transform-private-methods'),
    require.resolve('@babel/plugin-transform-nullish-coalescing-operator'),
    require.resolve('@babel/plugin-transform-class-static-block'),
  ],
};
