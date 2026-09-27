#!/usr/bin/env node

/**
 * Generates examples/graphiql-cdn/index.html from the latest stable packages.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PLUGINS = ['collections', 'doc-explorer', 'history', 'query-builder'];
const PACKAGES = [
  'react',
  'react-dom',
  'graphiql',
  '@graphiql/react',
  '@graphiql/toolkit',
  'graphql',
  'graphql-language-service',
  'monaco-editor',
  'monaco-graphql',
  ...PLUGINS.map(plugin => `@graphiql/plugin-${plugin}`),
];

async function fetchLatestVersion(packageName) {
  const url = `https://registry.npmjs.org/${packageName}/latest`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${packageName}: ${response.statusText}`);
  }
  const { version } = await response.json();
  return [packageName, version];
}

async function fetchIntegrityHash(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const content = Buffer.from(await response.arrayBuffer());
  const hash = crypto.createHash('sha384').update(content).digest('base64');
  return [url, `sha384-${hash}`];
}

async function main() {
  const versions = Object.fromEntries(
    await Promise.all(PACKAGES.map(fetchLatestVersion)),
  );
  const cdn = name => `https://esm.sh/${name}@${versions[name]}`;
  const moduleUrl = (name, options = '') =>
    `${cdn(name)}?${options ? `${options}&` : ''}target=es2022`;
  const monaco = moduleUrl('monaco-editor', 'bundle');
  const alias = source => `data:text/javascript,${encodeURIComponent(source)}`;
  const workerUrls = {
    JsonWorker: `${cdn('monaco-editor')}/languages/features/json/json.worker.js?worker&target=es2022`,
    GraphQLWorker: `${cdn('monaco-graphql')}/esm/graphql.worker.js?worker&target=es2022&deps=monaco-editor@${versions['monaco-editor']},graphql-language-service@${versions['graphql-language-service']},graphql@${versions.graphql}`,
    EditorWorker: `${cdn('monaco-editor')}/editor/editor.worker.js?worker&target=es2022`,
  };

  const imports = {
    react: moduleUrl('react'),
    'react/': `${cdn('react')}/`,
    'react-dom': moduleUrl('react-dom', 'external=react'),
    'react-dom/': `${cdn('react-dom')}/`,
    'react-dom/client': `${cdn('react-dom')}/client?external=react&target=es2022`,
    graphiql: moduleUrl(
      'graphiql',
      `standalone&external=react,react-dom,@graphiql/react,graphql,${PLUGINS.map(plugin => `@graphiql/plugin-${plugin}`).join(',')}`,
    ),
    'graphiql/': `${cdn('graphiql')}/`,
    '@graphiql/react': moduleUrl(
      '@graphiql/react',
      'standalone&external=react,react-dom,graphql,@graphiql/toolkit,graphql-language-service,monaco-editor,monaco-graphql',
    ),
    '@graphiql/toolkit': moduleUrl(
      '@graphiql/toolkit',
      'standalone&external=graphql',
    ),
    graphql: moduleUrl('graphql'),
    'graphql-language-service': moduleUrl(
      'graphql-language-service',
      'bundle&external=graphql',
    ),
    'monaco-editor': monaco,
    'monaco-editor/': `${cdn('monaco-editor')}/`,
    'monaco-graphql': moduleUrl(
      'monaco-graphql',
      'bundle&external=graphql,monaco-editor,graphql-language-service',
    ),
    'monaco-graphql/': `${cdn('monaco-graphql')}/`,
    'monaco-graphql/esm/utils.js': `${cdn('monaco-graphql')}/esm/utils.js?bundle&external=graphql,monaco-editor,graphql-language-service&target=es2022`,
    'monaco-graphql/esm/monaco-editor.js': monaco,
    'monaco-graphql/esm/lite.js': `${cdn('monaco-graphql')}/esm/lite.js?bundle&external=graphql,monaco-editor,graphql-language-service&target=es2022`,
  };
  for (const plugin of PLUGINS) {
    const name = `@graphiql/plugin-${plugin}`;
    imports[name] = moduleUrl(
      name,
      'standalone&external=react,react-dom,graphql,@graphiql/react,@graphiql/toolkit,graphql-language-service,monaco-editor,monaco-graphql',
    );
  }
  for (const subpath of [
    'editor',
    'editor/editor.api',
    'editor/editor.api.js',
    'features/register.all',
    'languages/definitions/graphql/register.js',
    'editor/common/core/range.js',
    'editor/common/services/editorBaseApi.js',
    'editor/common/standalone/standaloneEnums.js',
  ]) {
    imports[`monaco-editor/${subpath}`] = monaco;
  }
  imports['monaco-editor/base/common/uri.js'] = alias(
    `export { Uri as URI } from '${monaco}';`,
  );
  for (const subpath of [
    'languages/features/json/register',
    'languages/features/json/register.js',
  ]) {
    imports[`monaco-editor/${subpath}`] = alias(
      `import { json } from '${monaco}'; export const { jsonDefaults, getWorker } = json;`,
    );
  }

  // esm.sh's process shim reports versions.node, which makes Monaco ignore
  // navigator.platform. Apply this browser alias only inside Monaco.
  const scopes = {
    [`${cdn('monaco-editor')}/`]: {
      'https://esm.sh/node/process.mjs': alias(
        'export default { env: { NODE_ENV: "production" }, browser: true };',
      ),
    },
  };
  const urls = [
    ...new Set([...Object.values(imports), ...Object.values(workerUrls)]),
  ].filter(url => url.startsWith('https:') && !url.endsWith('/'));
  const integrity = Object.fromEntries(
    await Promise.all(urls.map(fetchIntegrityHash)),
  );
  const css = `${cdn('graphiql')}/dist/style.css`;
  const cssHash = (await fetchIntegrityHash(css))[1];
  const template = fs.readFileSync(
    path.join(import.meta.dirname, '../../resources/index.html.template'),
    'utf8',
  );
  const importMap = JSON.stringify({ imports, scopes, integrity }, null, 2)
    .split('\n')
    .map(line => `      ${line}`)
    .join('\n');
  let output = template
    .replace('{{IMPORTMAP}}', importMap)
    .replace('{{GRAPHIQL_CSS_URL}}', css)
    .replace('{{GRAPHIQL_CSS_INTEGRITY}}', cssHash);
  for (const [worker, url] of Object.entries(workerUrls)) {
    output = output.replace(`{{${worker}}}`, url);
  }
  console.log(output);
}

main();
