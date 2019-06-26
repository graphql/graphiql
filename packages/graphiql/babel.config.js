const config = {
  presets: [
    require.resolve('@babel/preset-flow'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
};

if (process.env.CDN) {
  config.presets.push(
    [
      require.resolve('@babel/preset-env'),
      { 
        useBuiltIns: 'entry'
      },
    ]
  );
} else {
  config.presets.push(
    [
      require.resolve('@babel/preset-env'),
      {
        useBuiltIns: 'entry',
        modules: 'commonjs',
        ignoreBrowserslistConfig: true,
        targets: {
          browsers: 'last 2 versions',
        },
      },
    ]
  );
}

module.exports = config;
