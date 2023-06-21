const base = require('../../jest.config.base')(__dirname);

module.exports = {
  ...base,
  '\\.svg$': `${__dirname}/__mocks__/svg`,
};
