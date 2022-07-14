const base = require('../../jest.config.base')(__dirname);

module.exports = {
  ...base,
  moduleNameMapper: {
    '\\.svg$': `${__dirname}/mocks/svg`,
    ...base.moduleNameMapper,
  },
};
