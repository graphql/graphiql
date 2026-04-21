import { writeFile } from 'node:fs/promises';
import pkgJson from '../package.json' with { type: 'json' };

async function setResolution(): Promise<void> {
  const tag = process.argv[2];
  if (!tag) {
    throw new Error('no tag provided');
  }

  const [pkg, version] = tag.split('@');
  if (!pkg || !version) {
    throw new Error(`Invalid tag ${tag}`);
  }

  await writeFile(
    '../package.json',
    JSON.stringify(
      {
        ...pkgJson,
        resolutions: {
          ...pkgJson.resolutions,
          [pkg]: version,
        },
      },
      null,
      2,
    ),
    'utf8',
  );
}

setResolution().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
