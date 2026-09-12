import { globSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bundleArtifacts = [
  '{packages,examples}/*/{out,bundle}',
  'packages/graphiql/{webpack,monaco,cm6,cdn}',
];

const buildArtifacts = [
  ...bundleArtifacts,
  '{packages,examples}/*/{dist,esm,.next,.react-router}',
  '{packages,examples}/*/*.tsbuildinfo',
  '*.tsbuildinfo',
  'resources/*.tsbuildinfo',
  'packages/graphiql/typedoc',
  'packages/codemirror-graphql/{cm6-legacy,results,utils,variables}',
  'packages/codemirror-graphql/*.{js,js.flow,js.map,d.ts,d.ts.map}',
];

export function cleanBuildArtifacts(root: string, bundlesOnly = false) {
  const files = globSync(bundlesOnly ? bundleArtifacts : buildArtifacts, {
    cwd: root,
    exclude: ['packages/codemirror-graphql/*.config.js'],
  });
  for (const file of files) {
    rmSync(path.join(root, file), { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--bundles')) {
    throw new Error('Usage: node scripts/clean.mts [--bundles]');
  }
  cleanBuildArtifacts(
    path.resolve(import.meta.dirname, '..'),
    args[0] === '--bundles',
  );
}
