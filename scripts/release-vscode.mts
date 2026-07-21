import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { publishVSIX } from '@vscode/vsce';
import { publish as ovsxPublish } from 'ovsx';

const PACKAGES = [
  'vscode-graphql',
  'vscode-graphql-syntax',
  'vscode-graphql-execution',
] as const;
type VscodePackage = (typeof PACKAGES)[number];

interface PublishedPackage {
  name: string;
  version: string;
}

function publishedVscodePackages(): VscodePackage[] {
  const raw = process.env.PUBLISHED_PACKAGES;
  if (!raw) {
    return [];
  }
  const all = JSON.parse(raw) as PublishedPackage[];
  const names = new Set(all.map(p => p.name));
  return PACKAGES.filter(p => names.has(p));
}

async function readVersion(pkg: VscodePackage): Promise<string> {
  const json = await readFile(`packages/${pkg}/package.json`, 'utf8');
  return (JSON.parse(json) as { version: string }).version;
}

function vsixPath(
  baseDir: string,
  pkg: VscodePackage,
  version: string,
): string {
  return `${baseDir}/packages/${pkg}/${pkg}-${version}.vsix`;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function runForEach(
  packages: VscodePackage[],
  label: string,
  fn: (pkg: VscodePackage) => Promise<void>,
): Promise<void> {
  let failures = 0;
  for (const pkg of packages) {
    try {
      await fn(pkg);
    } catch (err) {
      failures += 1;
      console.error(`[${label}] failed for ${pkg}:`, err);
    }
  }
  if (failures > 0) {
    throw new Error(
      `${failures}/${packages.length} ${label} operation(s) failed`,
    );
  }
}

async function build(packages: VscodePackage[]): Promise<void> {
  await runForEach(packages, 'build', async pkg => {
    console.log(`Building ${pkg}.vsix`);
    const { status } = spawnSync('yarn', ['workspace', pkg, 'vsce:package'], {
      stdio: 'inherit',
    });
    if (status !== 0) {
      throw new Error(
        `yarn workspace ${pkg} vsce:package exited with status ${status}`,
      );
    }
  });
}

async function attach(packages: VscodePackage[]): Promise<void> {
  await runForEach(packages, 'attach', async pkg => {
    const version = await readVersion(pkg);
    const tag = `${pkg}@${version}`;
    const path = vsixPath('.', pkg, version);
    console.log(`Attaching ${path} to release ${tag}`);
    const { status } = spawnSync(
      'gh',
      ['release', 'upload', tag, path, '--clobber'],
      { stdio: 'inherit' },
    );
    if (status !== 0) {
      throw new Error(`gh release upload exited with status ${status}`);
    }
  });
}

async function publishToVsce(packages: VscodePackage[]): Promise<void> {
  const pat = requireEnv('VSCE_PAT');
  await runForEach(packages, 'vsce publish', async pkg => {
    const version = await readVersion(pkg);
    const path = vsixPath('vsix', pkg, version);
    console.log(`Publishing ${path} to VSCode Marketplace`);
    await publishVSIX(path, { pat, skipDuplicate: true });
  });
}

async function publishToOvsx(packages: VscodePackage[]): Promise<void> {
  const pat = requireEnv('OVSX_PAT');
  await runForEach(packages, 'ovsx publish', async pkg => {
    const version = await readVersion(pkg);
    const path = vsixPath('vsix', pkg, version);
    console.log(`Publishing ${path} to Open VSX Registry`);
    const results = await ovsxPublish({
      extensionFile: path,
      pat,
      skipDuplicate: true,
    });
    const rejected = results.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      throw new AggregateError(
        rejected.map(r => r.reason),
        `${rejected.length} target(s) rejected by Open VSX`,
      );
    }
  });
}

const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

const command = positionals[0];
const packages = publishedVscodePackages();

if (packages.length === 0) {
  console.log('No VSCode extensions were published; nothing to do.');
  process.exit(0);
}

console.log(`VSCode packages: ${packages.join(', ')}`);

switch (command) {
  case 'build':
    await build(packages);
    break;
  case 'attach':
    await attach(packages);
    break;
  case 'publish-vsce':
    await publishToVsce(packages);
    break;
  case 'publish-ovsx':
    await publishToOvsx(packages);
    break;
  default:
    console.error(
      'Usage: node scripts/release-vscode.mts <build|attach|publish-vsce|publish-ovsx>',
    );
    process.exit(1);
}
