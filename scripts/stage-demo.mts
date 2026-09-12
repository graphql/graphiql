import { cp, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const demo = process.argv[2];
if (demo !== 'webpack' && demo !== 'monaco') {
  throw new Error('Usage: node scripts/stage-demo.mts <webpack|monaco>');
}

const example =
  demo === 'webpack' ? 'graphiql-webpack' : 'monaco-graphql-webpack';
const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'examples', example, 'dist');
const destination = path.join(root, 'packages/graphiql', demo);

if (!(await stat(source)).isDirectory()) {
  throw new Error(`Demo build output is not a directory: ${source}`);
}

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
