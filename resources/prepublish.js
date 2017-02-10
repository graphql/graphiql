var execSync = require('child_process').execSync;

var out = function (command) {
  execSync(command, {stdio:'inherit'});
};

console.log('"Running node ./resources/prepublish.js"');

if (process.env.npm_config_argv) {
  let npmConfigArgv = JSON.parse(process.env.npm_config_argv);
  // Because of a long-running npm issue (https://github.com/npm/npm/issues/3059)
  // prepublish runs after `npm install` and `npm pack`.
  // In order to only run prepublish before `npm publish`, we have to check argv.
  if (npmConfigArgv.original[0] === 'publish') {
    // Publishing to NPM is currently supported by Travis CI, which ensures that all
    // tests pass first and the deployed module contains the correct file structure.
    // In order to prevent inadvertently circumventing this, we ensure that a CI
    // environment exists before continuing.
    if (!process.env.CI) {
      console.log('Only Travis CI can publish to NPM.');
      console.log('Ensure git is left is a good state by backing out any commits and deleting any tags.');
      console.log('Then read CONTRIBUTING.md to learn how to publish to NPM.');
      process.exit(1);
    } else {
      out('npm run build;');
    }
  } else {
    console.log('"But skipping ./resources/prepublish.js since this is non-publish."');
  }
}
