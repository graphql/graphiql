import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pkgJson from '../package.json' with { type: 'json' }

async function setResolution(): Promise<void> {
  const tag = process.argv[2];
  if (!tag) {
    throw new Error('no tag provided');
  }

  const [pkg, version] = tag.split('@');
  if (!pkg || !version) {
    throw new Error(`Invalid tag ${tag}`);
  }

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
