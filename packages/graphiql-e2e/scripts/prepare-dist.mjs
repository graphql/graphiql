import { mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceAssets = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const destinationRoot = fileURLToPath(new URL('../dist/e2e/', import.meta.url));

await mkdir(destinationRoot, { recursive: true });
await rename(sourceAssets, `${destinationRoot}assets`);
