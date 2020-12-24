const path = require('path');

module.exports = dir => {
  const package = require(`${dir}/package.json`);

  return {
    globals: {
      'ts-jest': {
        tsConfig: `${__dirname}/resources/tsconfig.base.esm.json`,
      },
    },
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: `${__dirname}/coverage/jest`,
    setupFilesAfterEnv: [path.join(__dirname, '/resources/test.config.js')],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        'identity-obj-proxy',
      '\\.(css|less)$': 'identity-obj-proxy',
      '^graphql-language-([^/]+)': `${__dirname}/packages/graphql-language-$1/src`,
      '^@graphiql-plugins\\/([^/]+)': `${__dirname}/plugins/$1/src`,
      '^codemirror-graphql\\/([^]+)': `${__dirname}/packages/codemirror-graphql/src/$1`,
      '^example-([^/]+)': `${__dirname}/examples/$1/src`,
    },
    testMatch: ['**/*[-.](spec|test).[jt]s?(x)', '!**/cypress/**'],
    testEnvironment: require.resolve('jest-environment-jsdom'),
    testPathIgnorePatterns: ['node_modules', 'dist', 'cypress'],
    collectCoverageFrom: [
      '**/src/**/*.{js,jsx,ts,tsx}',
      '!**/src/**/*.stories.js*',
      '!**/new-components/themes/**/index.js*',
      '!**/new-components/**', // TODO: add proper coverage to new components
      '!**/{dist,esm}/**',
      '!**/node_modules/**',
      '!**/__tests__/**',
      '!**/resources/**',
      '!**/test/**',
      '!**/examples/**',
      '!**/codemirror-graphql/**',
      '!**/graphiql-2-rfc-context/**',
      '!**/graphql-language-service-types/**',
      '!**/*rfc*/**',
      '!**/*.d.ts',
      '!**/types.ts',
    ],

    roots: [`<rootDir>`],

    rootDir: dir,
    name: package.name,
    displayName: package.name,
  };
};
