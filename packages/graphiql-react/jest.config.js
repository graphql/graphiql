const base = require('../../jest.config.base')(__dirname);

module.exports = {
  ...base,
  moduleNameMapper: {
    '\\.svg\\?react$': `${__dirname}/__mocks__/svg`,
    ...base.moduleNameMapper,
  },
};
