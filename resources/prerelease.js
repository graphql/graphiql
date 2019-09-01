const execa = require('execa');
const argv = require('yargs').argv;

/**
 *
 * @param {yargs<process.argv>} args from yargs
 */
const conventionalPrerelease = async args => {
  try {
    const { _, $0, packages, ...otherArgs } = args;
    if (!packages || !packages.length) {
      throw Error(
        `must supply commas seperated list of packages to apply prerelease for,\n ala --packages "'package-name','package-name'",\n or supply --packages all for all packages`,
      );
      process.exit(1);
    }
    let finalArgs = [
      'version',
      '--conventional-commits',
      '--conventional-prerelease',
      '--allow-branch',
      '*'
    ];
    if (otherArgs) {
      finalArgs = [...finalArgs, ...process.argv.slice(finalArgs.length - 1)];
      console.log('finalArgs', finalArgs);
    }
    // defualt lerna.json configs supply other important arguments here
    await execa('lerna', [...finalArgs, packages === 'all' ? '*' : packages]);
    console.log(
      "'yarn prerelease' has completed, you can now 'yarn graduate'\n these packages to full release versions only from a master branch",
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

(async () => {
  console.log(argv);
  await conventionalPrerelease(argv);
})();
