const testConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
      },
    ],
    '@babel/preset-flow',
  ]
}

module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-flow',
  ],
  plugins: ['@babel/plugin-proposal-class-properties'
  ],
  env: {
    test: testConfig
  },
};
