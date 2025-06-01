const path = require('node:path');
const baseConfig = require('../../jest.config.base')(__dirname);

module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // In `MessageProcessor.spec.ts` we import GraphQL schema from graphiql which uses graphql 17
    // Which produce `Duplicate "graphql" modules cannot be used at the same time` error
    '^graphql$': path.resolve(__dirname, '../../node_modules/graphql'),
  },
};
