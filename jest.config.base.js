const path = require('node:path');

module.exports = (dir, env = 'jsdom') => {
  const package = require(`${dir}/package.json`);
  const setupFilesAfterEnv = [];
  if (env === 'jsdom') {
    setupFilesAfterEnv.push(path.join(__dirname, '/resources/test.config.js'));
  }
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
      '\\.css$': 'identity-obj-proxy',
      '^graphql-language-service-([^/]+)': `${__dirname}/packages/graphql-language-service/src/$1`,
      '^graphql-language-([^/]+)': `${__dirname}/packages/graphql-language-$1/src`,
      '^@graphiql\\/([^/]+)': `${__dirname}/packages/graphiql-$1/src`,
      '^codemirror-graphql\\/esm([^]+)\\.js': `${__dirname}/packages/codemirror-graphql/src/$1`,
      '^codemirror-graphql\\/cjs([^]+)': `${__dirname}/packages/codemirror-graphql/src/$1`,
      // relies on compilation
      '^cm6-graphql\\/src\\/([^]+)': `${__dirname}/packages/cm6-graphql/dist/$1`,
      // because of the svelte compiler's export patterns i guess?
      'svelte/compiler': `${__dirname}/node_modules/svelte/compiler.cjs`,
    },
    testMatch: ['**/*[-.](spec|test).[jt]s?(x)', '!**/cypress/**'],
    testEnvironment: env,
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
