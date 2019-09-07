const path = require('path');

module.exports = {
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  setupFiles: [path.join(__dirname, '/resources/enzyme.config.js')],
  testMatch: [
    '<rootDir>/packages/*/src/**/*-test.js',
    '<rootDir>/packages/*/src/**/*.spec.js',
  ],
  transform: {
    '^.+\\.jsx?$': require.resolve('./resources/jestBabelTransform'),
  },
  testEnvironment: require.resolve('jest-environment-jsdom-global'),
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
    'codemirror-graphql',
  ],
  collectCoverageFrom: [
    '**/src/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/resources/**',
    '!packages/codemirrir-graphql/**',
  ],
};
