const base = require('../../jest.config.base')(__dirname);

// remove the ignore line for cm6-graphql
base.testPathIgnorePatterns.pop()

module.exports = {
  ...base,
  transformIgnorePatterns: [
    '/node_modules/(?!@lezer)',
  ],
};
