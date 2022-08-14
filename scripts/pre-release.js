/* eslint-disable */
// const semver = require('semver');
// const { execa } = import('execa');
const cp = require('child_process');
const { basename } = require('path');

const { read: readConfig } = require('@changesets/config');
const readChangesets = require('@changesets/read').default;
const assembleReleasePlan =
  require('@changesets/assemble-release-plan').default;
const applyReleasePlan = require('@changesets/apply-release-plan').default;
const { getPackages } = require('@manypkg/get-packages');

function getRelevantChangesets(baseBranch) {
  const comparePoint = cp
    .spawnSync('git', ['merge-base', `origin/${baseBranch}`, 'HEAD'])
    .stdout.toString()
    .trim();
  const listModifiedFiles = cp
    .spawnSync('git', ['diff', '--name-only', comparePoint])
    .stdout.toString()
    .trim()
    .split('\n');

  const items = listModifiedFiles
    .filter(f => f.startsWith('.changeset'))
    .map(f => basename(f, '.md'));

  return items;
}
const execOpts = { stderr: 'inherit', stdout: 'inherit' };
const git = async (...commands) => execa('git', commands, execOpts);

const noChangesWarning = [
  'Unable to find any relevant package for canary publishing.',
  'Please make sure changesets exists, and that you have graduated the patch versions you want to increment!',
].join(' ');

async function updateVersions() {
  const cwd = process.cwd();
  const packages = await getPackages(cwd);
  const config = await readConfig(cwd, packages);
  const modifiedChangesets = getRelevantChangesets(config.baseBranch);
  const changesets = (await readChangesets(cwd)).filter(change =>
    modifiedChangesets.includes(change.id),
  );
  const isMain = process.env.GITHUB_REF_NAME?.includes(config.baseBranch);
  const isNext = process.env.GITHUB_REF_NAME?.includes('next/');
  if (isMain) {
    console.log('skipping pre-release on main');
    return;
  }
  // skip if not next/ branch
  // we will configure this in actions anyways, but just in case
  if (!isNext) {
    console.log('skipping pre-release on non next/ branch');
    return;
  }
  // let vscodeRelease = false;

  if (changesets.length === 0) {
    console.warn(noChangesWarning);
    process.exit(1);
  } else {
    const releasePlan = assembleReleasePlan(
      changesets,
      packages,
      config,
      [],
      false,
    );

    if (releasePlan.releases.length === 0) {
      console.warn(noChangesWarning);
      process.exit(1);
    } else {
      // TODO: vscode
      //   for (const release of releasePlan.releases) {
      //     if (
      //       release.name.includes('vscode-graphql') &&
      //       release.changesets?.type !== 'none'
      //     ) {
      //       // vsce pre-release only accept x.y.z versions
      //       release.newVersion = vscodeRelease = semver.patch(release.oldVersion);
      //     }
      //   }

      await applyReleasePlan(
        releasePlan,
        packages,
        {
          ...config,
          commit: true,
        },
        false,
        true,
      );
      git('push', 'origin');
      // TODO: get this working
      //   if (vscodeRelease) {
      //     await preReleaseVSCodeExtensions(vscodeRelease);
      //   }
    }
  }
}

updateVersions()
  .then(() => {
    console.info(`Done!`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

// TODO: vscode
//
// const execOpts = { stderr: 'inherit', stdout: 'inherit' };
// const git = async (...commands) => execa('git', commands, execOpts);
//
//   async function preReleaseVSCodeExtensions(version) {
//     try {
//       await execa(
//         'yarn',
//         ['wsrun', `-p`, `'vscode-*'`, ' -s', 'release', '--pre'],
//         execOpts,
//       );
//     } catch (err) {
//       console.error('vscode-graphql pre-release failed on publish:', err);
//       process.exit(1);
//     }
//     try {
//       await git('add', `packages/vscode-*/package.json`);
//       await git('commit', `-m`, `pre-release \`vscode-graphql@${version}\``);
//       await git('push');
//     } catch (err) {
//       console.error('vscode-graphql pre-release failed on git command:', err);
//       process.exit(1);
//     }
//   }
