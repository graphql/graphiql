const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');

module.exports = (on, config) => {
  on('file:preprocessor', cypressTypeScriptPreprocessor);
  // @ts-ignore
  // require('@cypress/code-coverage/task')(on, config);
  return config;
};
