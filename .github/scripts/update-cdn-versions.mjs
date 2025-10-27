#!/usr/bin/env node

/**
 * Generates examples/graphiql-cdn/index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PACKAGES = [
  'react',
  'react-dom',
  'graphiql',
  '@graphiql/plugin-explorer',
  '@graphiql/react',
  '@graphiql/toolkit',
  'graphql',
];

async function fetchIntegrityHash(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const content = await response.text();
  const hash = crypto.createHash('sha384').update(content).digest('base64');
  return [url, `sha384-${hash}`];
}

async function fetchLatestVersion(packageName) {
  const url = `https://registry.npmjs.org/${packageName}/latest`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${packageName}: ${response.statusText}`);
  }
  const { version } = await response.json();
  return [packageName, version]
}

async function main () {
  const versions = Object.fromEntries(await Promise.all(PACKAGES.map(fetchLatestVersion)));
  const cdnUrl = packageName => `https://esm.sh/${packageName}@${versions[packageName]}`;

  // JS
  const imports = {
    'react': cdnUrl('react'),
    'react/': `${cdnUrl('react-dom')}/`,
    'react-dom': cdnUrl('react-dom'),
    'react-dom/': `${cdnUrl('react-dom')}/`,
    'graphiql': `${cdnUrl('graphiql')}?standalone&external=react,react-dom,@graphiql/react,graphql`,
    'graphiql/': `${cdnUrl('graphiql')}/`,
    '@graphiql/plugin-explorer': `${cdnUrl('@graphiql/plugin-explorer')}?standalone&external=react,@graphiql/react,graphql`,
    '@graphiql/react': `${cdnUrl('@graphiql/react')}?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid`,
    '@graphiql/toolkit': `${cdnUrl('@graphiql/toolkit')}?standalone&external=graphql`,
    'graphql': cdnUrl('graphql'),
    '@emotion/is-prop-valid': "data:text/javascript,"
  };

  const integrity = Object.fromEntries(await Promise.all([
    cdnUrl('react'),
    cdnUrl('react-dom'),
    cdnUrl('graphiql'),
    `${cdnUrl('graphiql')}?standalone&external=react,react-dom,@graphiql/react,graphql`,
    cdnUrl('@graphiql/plugin-explorer'),
    `${cdnUrl('@graphiql/react')}?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid`,
    `${cdnUrl('@graphiql/toolkit')}?standalone&external=graphql`,
    cdnUrl('graphql'),
  ].map(fetchIntegrityHash)));

  const importMap = { imports, integrity };

  // CSS
  const graphiqlCss = `${cdnUrl('graphiql')}/dist/style.css`;
  const graphiqlPluginExplorer = `${cdnUrl('@graphiql/plugin-explorer')}/dist/style.css`;

  // Generate index.html
  const templatePath = path.join(import.meta.dirname, '../../resources/index.html.template');
  const template = fs.readFileSync(templatePath, 'utf8');

  const indent = lines => lines.split('\n').map(line => `      ${line}`).join('\n');

  const output = template
    .replace('{{IMPORTMAP}}', indent(JSON.stringify(importMap, null, 2)))
    .replace('{{GRAPHIQL_CSS_URL}}', graphiqlCss)
    .replace('{{GRAPHIQL_CSS_INTEGRITY}}', (await fetchIntegrityHash(graphiqlCss))[1])
    .replace('{{PLUGIN_EXPLORER_CSS_URL}}', graphiqlPluginExplorer)
    .replace('{{PLUGIN_EXPLORER_CSS_INTEGRITY}}', (await fetchIntegrityHash(graphiqlPluginExplorer))[1]);

  console.log(output);
}

main();
