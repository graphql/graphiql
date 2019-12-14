// for ESM don't transpile modules

const envConfig = {
  ignoreBrowserslistConfig: true,
  modules: 'commonjs',
  targets: { node: true }
};

if (process.env.ESM) {
  envConfig.modules = false
}

if (process.env.CDN) {
  envConfig.modules = 'umd'
  envConfig.targets = null
  envConfig.ignoreBrowserslistConfig = false
}

module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      envConfig,
    ],
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-syntax-dynamic-import'),
  ],
};
