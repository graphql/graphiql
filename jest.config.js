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
  coverageDirectory: 'coverage/jest',
  setupFiles: [path.join(__dirname, '/resources/test.config.js')],
  testMatch: [
    '<rootDir>/packages/*/src/**/*-test.{js,ts}',
    '<rootDir>/packages/*/src/**/*.spec.{js,ts}',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'identity-obj-proxy',
    '\\.(css|less)$': 'identity-obj-proxy',
    '^graphql-language-([^/]+)': '<rootDir>/packages/graphql-language-$1/src',
    '^codemirror-graphql\\/([^]+)':
      '<rootDir>/packages/codemirror-graphql/src/$1',
    '^example-([^/]+)': '<rootDir>/examples/$1/src',
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
    '!**/src/**/*.stories.js*',
    '!**/new-components/themes/**/index.js*',
    '!**/new-components/**', // TODO: add proper coverage to new components
    '!**/{dist,esm}/**',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/resources/**',
    '!**/examples/**',
    '!**/codemirror-graphql/**',
    '!**/graphql-language-service-types/**',
  ],
};
