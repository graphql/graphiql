// for ESM don't transpile modules

const envConfig = {
  modules: 'commonjs',
};

if (process.env.ESM) {
  envConfig.modules = false;
  envConfig.targets = { node: 'current' };
}

if (process.env.CDN) {
  envConfig.modules = 'umd';
  envConfig.targets = null;
}

module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), envConfig],
    [
      require.resolve('@babel/preset-react'),
      { runtime: 'classic', development: false },
    ],
    [
      require.resolve('@babel/preset-typescript'),
      { onlyRemoveTypeImports: false },
    ],
  ],
  env: {
    development: {
      compact: false,
    },
  },
  plugins: [
    require.resolve('@babel/plugin-transform-class-properties'),

    require.resolve('@babel/plugin-transform-nullish-coalescing-operator'),
    require.resolve('@babel/plugin-transform-optional-chaining'),
    require.resolve('@babel/plugin-transform-private-methods'),
    ['babel-plugin-transform-import-meta', { module: 'ES6' }],
  ],
};
