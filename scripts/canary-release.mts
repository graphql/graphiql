import cp from 'node:child_process';
import { basename } from 'node:path';
import applyReleasePlan from '@changesets/apply-release-plan';
import assembleReleasePlan from '@changesets/assemble-release-plan';
import { read as readConfig } from '@changesets/config';
import readChangesets from '@changesets/read';
import { getPackages } from '@manypkg/get-packages';
import semver from 'semver';

type ReleaseType = 'major' | 'minor' | 'patch';

function getNewVersion(version: string, type: ReleaseType): string | null {
  const gitHash = cp
    .spawnSync('git', ['rev-parse', '--short', 'HEAD'])
    .stdout.toString()
    .trim();

  return semver.inc(version, `pre${type}`, true, 'canary-' + gitHash);
}

function getRelevantChangesets(baseBranch: string): string[] {
  const comparePoint = cp
    .spawnSync('git', ['merge-base', `origin/${baseBranch}`, 'HEAD'])
    .stdout.toString()
    .trim();
  const listModifiedFiles = cp
    .spawnSync('git', ['diff', '--name-only', comparePoint])
    .stdout.toString()
    .trim()
    .split('\n');

  return listModifiedFiles
    .filter(f => f.startsWith('.changeset'))
    .map(f => basename(f, '.md'));
}

async function updateVersions(): Promise<void> {
  const cwd = process.cwd();
  const packages = await getPackages(cwd);
  const config = await readConfig(cwd, packages);
  const modifiedChangesets = getRelevantChangesets(config.baseBranch);
  const changesets = (await readChangesets(cwd)).filter(change =>
    modifiedChangesets.includes(change.id),
  );

  if (changesets.length === 0) {
    console.warn(
      'Unable to find any relevant package for canary publishing. Please make sure changesets exists!',
    );
    process.exit(1);
  }

  const releasePlan = assembleReleasePlan(
    changesets,
    packages,
    config,
    undefined,
    false,
  );

  if (releasePlan.releases.length === 0) {
    console.warn(
      'Unable to find any relevant package for canary releasing. Please make sure changesets exists!',
    );
    process.exit(1);
  }

  for (const release of releasePlan.releases) {
    if (
      release.name.includes('vscode-graphql') &&
      // `release.changesets` is typed as `string[]` in current @changesets/types,
      // so `.type` is always `undefined`. This predicate is preserved from the
      // original JS for behavioral parity; the inner assignment is therefore
      // overwritten by the second `if` whenever `release.type !== 'none'`.
      (release.changesets as unknown as { type?: string })?.type !== 'none'
    ) {
      // vsce pre-release only accepts x.y.z versions
      release.newVersion = String(semver.patch(release.oldVersion));
    }
    if (release.type !== 'none') {
      const newVersion = getNewVersion(release.oldVersion, release.type);
      if (newVersion) {
        release.newVersion = newVersion;
      }
    }
  }

  await applyReleasePlan(releasePlan, packages, {
    ...config,
    commit: false,
  });
}

updateVersions()
  .then(() => {
    console.info('Done!');
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
