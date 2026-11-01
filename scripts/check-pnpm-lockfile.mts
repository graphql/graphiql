import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lockfile = readFileSync('pnpm-lock.yaml', 'utf8');
const documentCount = lockfile
  .split(/^---$/m)
  .filter(document => document.trim()).length;

assert.equal(
  documentCount,
  1,
  `pnpm-lock.yaml must contain one YAML document, found ${documentCount}`,
);
