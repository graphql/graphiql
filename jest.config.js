const path = require('path');
const { jsWithTs: tsjPreset } = require('ts-jest/presets');
const { jsWithBabel: jsWithBabelPreset } = require('ts-jest/presets');

module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: './resources/tsconfig.base.esm.json',
    },
  },
  clearMocks: true,
  collectCoverage: true,
  setupFiles: [path.join(__dirname, '/resources/enzyme.config.js')],
  testMatch: [
    '<rootDir>/packages/*/src/**/*-test.{js,ts}',
    '<rootDir>/packages/*/src/**/*.spec.{js,ts}',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'identity-obj-proxy',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
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
