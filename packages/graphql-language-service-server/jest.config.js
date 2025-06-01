const path = require('node:path');
const baseConfig = require('../../jest.config.base')(__dirname);

module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // In `MessageProcessor.spec.ts`, we import a GraphQL schema from `graphiql`,
    // which depends on GraphQL v17. This causes an error `Duplicate "graphql" modules cannot be used at the same time`
    '^graphql$': path.resolve(__dirname, '../../node_modules/graphql'),
  },
};
