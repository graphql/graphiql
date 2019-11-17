// for ESM don't transpile modules
module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        modules: process.env.ESM ? false : 'commonjs',
        targets: process.env.ESM ? { node: true } : '> 0.25%, not dead'
      },
    ],
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-syntax-dynamic-import'),
  ],
};
