module.exports = dir => {
  const package = require(`${dir}/package.json`);
  const setupFilesAfterEnv = [];
  return {
    globals: {
      'ts-jest': {
        tsConfig: `${__dirname}/resources/tsconfig.base.esm.json`,
      },
    },
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: `${__dirname}/coverage/jest`,
    setupFilesAfterEnv,
    moduleNameMapper: {
      '^graphql-language-service-([^/]+)': `${__dirname}/packages/graphql-language-service/src/$1`,
      '^graphql-language-([^/]+)': `${__dirname}/packages/graphql-language-$1/src`,
      // because of the svelte compiler's export patterns i guess?
      'svelte/compiler': `${__dirname}/node_modules/svelte/compiler.cjs`,
    },
    testMatch: ['**/*[-.](spec|test).[jt]s?(x)', '!**/cypress/**'],
    testEnvironment: 'node',
    testPathIgnorePatterns: ['node_modules', 'dist', 'cypress'],
    collectCoverageFrom: ['**/src/**/*.{js,jsx,ts,tsx}'],
    transformIgnorePatterns: ['node_modules/(!@astrojs/compiler)'],
    coveragePathIgnorePatterns: [
      'dist',
      'esm',
      'node_modules',
      '__tests__',
      'resources',

      'examples',
      '.d.ts',
      'types.ts',
    ],

    roots: ['<rootDir>'],

    rootDir: dir,
    name: package.name,
    displayName: package.name,
  };
};
