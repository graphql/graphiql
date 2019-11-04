const babelEnvConfig = {
  ignoreBrowserslistConfig: Boolean(process.env.ESM),
  modules: process.env.ESM ? false : 'commonjs',
  targets: process.env.ESM ? 'last 1 chrome version, last 1 firefox version': undefined,
};

if (process.env.BUNDLE) {
  babelEnvConfig.modules = 'umd'
}

const config = {
  sourceMaps: true,
  presets: [
    [
      require.resolve('@babel/preset-env'),
      babelEnvConfig
    ],
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('@babel/plugin-syntax-dynamic-import'),
    require.resolve('@babel/plugin-proposal-class-properties'), 
  ],
  env: {
    test: {
      plugins: [
        require.resolve('@babel/plugin-syntax-dynamic-import'), 
        require.resolve('babel-plugin-dynamic-import-node')
      ]
    }
  }
};

module.exports = config
