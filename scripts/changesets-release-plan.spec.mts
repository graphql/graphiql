import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

type Release = { name: string; type: string; newVersion: string };

const require = createRequire(import.meta.url);
const requireFromCli = createRequire(require.resolve('@changesets/cli'));
const { assembleReleasePlan } = await import(
  pathToFileURL(requireFromCli.resolve('@changesets/assemble-release-plan'))
    .href
);
const { defaultConfig } = await import(
  pathToFileURL(requireFromCli.resolve('@changesets/config')).href
);

const packages = {
  rootDir: '/release-plan-fixture',
  rootPackage: {
    dir: '/release-plan-fixture',
    packageJson: { name: 'fixture', private: true, version: '0.0.0' },
  },
  packages: [
    {
      dir: '/release-plan-fixture/packages/peer',
      packageJson: { name: 'peer', version: '1.0.0' },
    },
    {
      dir: '/release-plan-fixture/packages/consumer',
      packageJson: {
        name: 'consumer',
        version: '1.0.0',
        peerDependencies: { peer: '^1.0.0' },
      },
    },
    {
      dir: '/release-plan-fixture/packages/test-server',
      packageJson: { name: 'test-server', private: true },
    },
  ],
};

const config = {
  ...defaultConfig,
  privatePackages: { version: true, tag: true },
};

function changeset(type: 'major' | 'minor') {
  return [
    {
      id: 'peer-change',
      summary: 'Update peer',
      releases: [{ name: 'peer', type }],
    },
  ];
}

test('an incompatible peer update bumps its dependent by a patch', () => {
  const plan = assembleReleasePlan(changeset('major'), packages, config);
  assert.deepEqual(
    plan.releases.map(({ name, type, newVersion }: Release) => ({
      name,
      type,
      newVersion,
    })),
    [
      { name: 'peer', type: 'major', newVersion: '2.0.0' },
      { name: 'consumer', type: 'patch', newVersion: '1.0.1' },
    ],
  );
});

test('a compatible peer update does not release its dependent', () => {
  const plan = assembleReleasePlan(changeset('minor'), packages, config);
  assert.equal(plan.releases.length, 1);
  assert.equal(plan.releases[0].name, 'peer');
  assert.equal(plan.releases[0].newVersion, '1.1.0');
});

test('prerelease planning skips private workspaces without versions', () => {
  const plan = assembleReleasePlan(changeset('major'), packages, config, {
    mode: 'pre',
    tag: 'next',
  });
  assert.deepEqual(
    plan.releases.map(({ name, newVersion }: Release) => ({
      name,
      newVersion,
    })),
    [
      { name: 'peer', newVersion: '2.0.0-next.0' },
      { name: 'consumer', newVersion: '1.0.1-next.0' },
    ],
  );
});
