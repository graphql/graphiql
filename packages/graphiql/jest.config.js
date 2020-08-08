const base = require('../../jest.config.base')(__dirname);

module.exports = {
  ...base,

  testMatch: [
    // All other tests disabled currently
    '**/src/utility/__tests__/*[-.](spec|test).[jt]s?(x)',
  ],
};
