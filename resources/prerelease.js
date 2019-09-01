const execFile = require('child_process').execFile;
const { promisify } = require('util');
const argv = require('yargs').argv;

const execFileAsync = promisify(execFile);
/**
 *
 * @param {yargs<process.argv>} args from yargs
 */
const conventionalPrerelease = async args => {
  const { _, $0, packages, ...otherArgs } = args;
  if (!packages || !packages.length) {
    throw Error(
      `must supply commas seperated list of packages to apply prerelease for,\n ala --packages "'package-name','package-name'",\n or supply --packages all for all packages`,
    );
  }
  let finalArgs = [
    'version',
    '--conventional-commits',
    '--conventional-prerelease',
    '--allow-branch',
    '*',
  ];
  if (otherArgs) {
    finalArgs = [...finalArgs, ...process.argv.slice(finalArgs.length - 1)];
  }

  // defualt lerna.json configs supply other important arguments here
  const result = await execFileAsync('lerna', [
    ...finalArgs,
    packages === 'all' ? '*' : packages,
  ]);
  console.log('result', result);
  console.log(
    "'yarn prerelease' has completed, you can now 'yarn graduate'\n these packages to full release versions only from a master branch",
  );
  process.exit(0);
};

(async () => {
  try {
    await conventionalPrerelease(argv);
  } catch (err) {
    console.error(
      err.message.includes('\n') ? err.message.split('\n')[0] : err.message,
    );
    process.exit(1);
  }
})();
