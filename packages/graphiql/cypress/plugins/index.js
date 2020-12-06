const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');

module.exports = (on, config) => {
  // @ts-ignore
  require('@cypress/code-coverage/task')(on, config);
  on('file:preprocessor', cypressTypeScriptPreprocessor);
  return config;
};
