const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');

module.exports = (on, config) => {
  on('file:preprocessor', cypressTypeScriptPreprocessor);
  // @ts-expect-error
  // require('@cypress/code-coverage/task')(on, config);
  return config;
};
