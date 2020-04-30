// for ESM don't transpile modules

const envConfig = {
  ignoreBrowserslistConfig: true,
  modules: 'commonjs',
  targets: { node: true },
  bugfixes: true,
};

if (process.env.ESM) {
  envConfig.modules = false;
}

if (process.env.CDN) {
  envConfig.modules = 'amd';
  envConfig.targets = null;
  envConfig.ignoreBrowserslistConfig = false;
}

module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), envConfig],
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
    require.resolve('@babel/preset-typescript'),
  ],
  env: {
    test: {
      plugins: [require.resolve('babel-plugin-macros')],
    },
    development: {
      compact: false,
    },
  },
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-syntax-dynamic-import'),
  ],
};
