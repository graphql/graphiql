const testConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        // temporarily just in babel config until we decide what to do with css vendor prefixes
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/react',
    '@babel/preset-flow',
  ]
}

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // temporarily just in babel config until we decide what to do with css vendor prefixes
        targets: {
          browsers: [
            'ie 9',
            'ios 9',
            'last 2 chrome versions',
            'last 2 edge versions',
            'last 2 firefox versions',
          ],
        },
      },
    ],
    '@babel/react',
    '@babel/preset-flow',
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
  env: {
    test: testConfig
  },
};
