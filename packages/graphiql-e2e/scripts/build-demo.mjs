import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const destinationRoot = fileURLToPath(
  new URL('../../graphiql/', import.meta.url),
);
const destinationAssets = fileURLToPath(
  new URL('../../graphiql/e2e/', import.meta.url),
);

await mkdir(destinationRoot, { recursive: true });
await copyFile(`${sourceRoot}index.html`, `${destinationRoot}index.html`);
await rm(destinationAssets, { force: true, recursive: true });
await cp(`${sourceRoot}e2e`, destinationAssets, { recursive: true });
