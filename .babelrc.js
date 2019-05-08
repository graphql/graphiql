module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // temporarily just in babel config until we decide what to do with css vendor prefixes
        targets: [
          'ie 9',
          'ios 9',
          'last 2 chrome versions',
          'last 2 edge versions',
          'last 2 firefox versions',
        ],
      },
    ],
    '@babel/react',
    '@babel/preset-flow',
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
};
