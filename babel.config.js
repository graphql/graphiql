// for ESM don't transpile modules

const envConfig = {
  modules: 'commonjs',
};

if (process.env.ESM) {
  envConfig.modules = false;
  envConfig.targets = { node: true };
  envConfig.bugfixes = true;
}

if (process.env.CDN) {
  envConfig.modules = 'umd';
  envConfig.targets = null;
}

module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), envConfig],
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
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
};
