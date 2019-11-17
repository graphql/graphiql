const path = require('path');
const { jsWithTs: tsjPreset } = require('ts-jest/presets');
const { jsWithBabel: jsWithBabelPreset } = require('ts-jest/presets');

module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: './resources/tsconfig.base.esm.json',
    },
  },
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  setupFiles: [path.join(__dirname, '/resources/enzyme.config.js')],
  testMatch: [
    '<rootDir>/packages/*/src/**/*-test.{js,ts}',
    '<rootDir>/packages/*/src/**/*.spec.{js,ts}',
  ],
  transform: {
    '^.+\\.jsx?$': require.resolve('./resources/jestBabelTransform'),
    ...tsjPreset.transform,
    ...jsWithBabelPreset.transform,
  },
  testEnvironment: require.resolve('jest-environment-jsdom-global'),
  testPathIgnorePatterns: ['node_modules', 'dist', 'codemirror-graphql'],
  collectCoverageFrom: [
    '**/src/**/*.{js,jsx,ts,tsx}',
    '!**/{dist,esm}/**',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/resources/**',
    '!**/codemirror-graphql/**',
  ],
};
