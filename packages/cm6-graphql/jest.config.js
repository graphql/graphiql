const base = require('../../jest.config.base')(__dirname);

module.exports = {
  ...base,
  transformIgnorePatterns: [
    '/node_modules/(?!@lezer)',
  ],
};
