const { readFile, writeFile } = require('fs/promises');
const path = require('path');

async function setResolution() {
  const [, , tag] = process.argv;
  if (!tag) {
    throw new Error('no tag provided');
  }

  const [package, version] = tag.split('@');
  if (!package || !version) {
    throw new Error(`Invalid tag ${tag}`);
  }
  const pkgPath = path.resolve(path.join(process.cwd(), 'package.json'));
  const pkg = JSON.parse((await readFile(pkgPath, 'utf-8')).toString());

  if (pkg.resolutions) {
    pkg.resolutions[package] = version;
  } else {
    pkg.resolutions = { [package]: version };
  }
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
}

setResolution()
  .then()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
