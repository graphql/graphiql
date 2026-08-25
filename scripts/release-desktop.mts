import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const PACKAGE_NAME = 'graphiql-desktop';
const RELEASE_DIR = `packages/${PACKAGE_NAME}/release`;

// Final installers only. Excludes electron-builder's other `release/`
// output: `.blockmap` files, `latest*.yml` auto-update metadata, and the
// `*-unpacked` staging directories.
const INSTALLER_EXTENSIONS = new Set([
  '.dmg',
  '.zip',
  '.AppImage',
  '.deb',
  '.exe',
]);

interface PublishedPackage {
  name: string;
  version: string;
}

function desktopWasPublished(): boolean {
  const raw = process.env.PUBLISHED_PACKAGES;
  if (!raw) {
    return false;
  }
  const all = JSON.parse(raw) as PublishedPackage[];
  return all.some(pkg => pkg.name === PACKAGE_NAME);
}

async function readVersion(): Promise<string> {
  const json = await readFile(`packages/${PACKAGE_NAME}/package.json`, 'utf8');
  return (JSON.parse(json) as { version: string }).version;
}

async function findInstallers(version: string): Promise<string[]> {
  const entries = await readdir(RELEASE_DIR, { withFileTypes: true });
  return entries
    .filter(
      entry =>
        entry.isFile() &&
        INSTALLER_EXTENSIONS.has(path.extname(entry.name)) &&
        // Guards against a stale artifact from a previous version left over
        // in `release/` getting uploaded under the wrong release tag.
        entry.name.includes(version),
    )
    .map(entry => path.join(RELEASE_DIR, entry.name))
    .sort();
}

async function sha256(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

// electron-builder's own `${os}` artifact-name macro, which our
// `artifactName` pattern in electron-builder.yml already uses (e.g.
// `GraphiQL-<version>-mac-arm64.dmg`) — match it here so the checksums file
// sits next to the installers it names using the same vocabulary, rather
// than Node's `darwin`/`win32`.
const OS_NAMES: Record<string, string> = {
  darwin: 'mac',
  linux: 'linux',
  win32: 'win',
};

function currentOsName(): string {
  return OS_NAMES[process.platform] ?? process.platform;
}

async function writeChecksums(installers: string[]): Promise<string> {
  const checksumsPath = path.join(
    RELEASE_DIR,
    `SHA256SUMS-${currentOsName()}.txt`,
  );
  const lines = await Promise.all(
    installers.map(async installer => {
      const hash = await sha256(installer);
      return `${hash}  ${path.basename(installer)}`;
    }),
  );
  await writeFile(checksumsPath, `${lines.join('\n')}\n`);
  return checksumsPath;
}

async function attach(): Promise<void> {
  const version = await readVersion();
  const tag = `${PACKAGE_NAME}@${version}`;

  const installers = await findInstallers(version);
  if (installers.length === 0) {
    throw new Error(
      `No installers for version ${version} found in ${RELEASE_DIR}; did "yarn workspace ${PACKAGE_NAME} dist" run first?`,
    );
  }

  console.log(
    `Computing checksums for ${installers.length} installer(s): ${installers.map(i => path.basename(i)).join(', ')}`,
  );
  const checksumsPath = await writeChecksums(installers);

  console.log(
    `Attaching installers + ${path.basename(checksumsPath)} to release ${tag}`,
  );
  const { status } = spawnSync(
    'gh',
    ['release', 'upload', tag, ...installers, checksumsPath, '--clobber'],
    { stdio: 'inherit' },
  );
  if (status !== 0) {
    throw new Error(`gh release upload exited with status ${status}`);
  }
}

const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

const command = positionals[0];

if (!desktopWasPublished()) {
  console.log(`${PACKAGE_NAME} was not published; nothing to do.`);
  process.exit(0);
}

switch (command) {
  case 'attach':
    await attach();
    break;
  default:
    console.error('Usage: node scripts/release-desktop.mts <attach>');
    process.exit(1);
}
