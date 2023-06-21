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
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        'identity-obj-proxy',
      '\\.(css|less)$': 'identity-obj-proxy',
      '^graphql-language-service-([^/]+)': `${__dirname}/packages/graphql-language-service/src/$1`,
      '^graphql-language-([^/]+)': `${__dirname}/packages/graphql-language-$1/src`,
      '^@graphiql\\/([^/]+)': `${__dirname}/packages/graphiql-$1/src`,
      '^@graphiql-plugins\\/([^/]+)': `${__dirname}/plugins/$1/src`,
      '^codemirror-graphql\\/esm([^]+)': `${__dirname}/packages/codemirror-graphql/src/$1`,
      '^codemirror-graphql\\/cjs([^]+)': `${__dirname}/packages/codemirror-graphql/src/$1`,
      '^example-([^/]+)': `${__dirname}/examples/$1/src`,
      '^-!svg-react-loader.*$': '<rootDir>/resources/jest/svgImportMock.js'
    },
    testMatch: ['**/*[-.](spec|test).[jt]s?(x)', '!**/cypress/**'],
    testEnvironment: env,
    testPathIgnorePatterns: ['node_modules', 'dist', 'cypress'],
    collectCoverageFrom: ['**/src/**/*.{js,jsx,ts,tsx}'],
    coveragePathIgnorePatterns: [
      'dist',
      'esm',
      'node_modules',
      '__tests__',
      'resources',
      'test',
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
