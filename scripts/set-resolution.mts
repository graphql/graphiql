import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface PackageJson {
  resolutions?: Record<string, string>;
  [key: string]: unknown;
}

async function setResolution(): Promise<void> {
  const [, , tag] = process.argv;
  if (!tag) {
    throw new Error('no tag provided');
  }

  const [pkg, version] = tag.split('@');
  if (!pkg || !version) {
    throw new Error(`Invalid tag ${tag}`);
  }
  const pkgPath = path.resolve(path.join(process.cwd(), 'package.json'));
  const pkgJson: PackageJson = JSON.parse(await readFile(pkgPath, 'utf8'));

  if (pkgJson.resolutions) {
    pkgJson.resolutions[pkg] = version;
  } else {
    pkgJson.resolutions = { [pkg]: version };
  }
  await writeFile(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf8');
}

setResolution().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
