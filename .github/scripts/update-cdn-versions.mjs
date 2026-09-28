#!/usr/bin/env node

/**
 * Generates examples/graphiql-cdn/index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const monacoEditorVersion = '0.57.0';
const versionOption = process.argv.indexOf('--graphiql-version');
const graphiqlVersion =
  versionOption === -1 ? 'latest' : process.argv[versionOption + 1];

if (!graphiqlVersion) {
  throw new Error('Pass a dist-tag or published version to --graphiql-version');
}

/**
 * Get the published package metadata for a dist-tag or exact version.
 *
 * @example
 *
 *   fetchPackage('left-pad', 'latest')
 *   => { name: 'left-pad', version: '1.0.1', ... }
 */
async function fetchPackage(packageName, version) {
  const url = `https://registry.npmjs.org/${packageName}/${version}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${packageName}@${version}: ${response.statusText}`,
    );
  }
  return response.json();
}

/**
 * Given the url of a file, return a tuple of: [url, sha384]
 *
 * @example
 *
 *   fetchIntegrityHash('https://esm.sh/left-pad/lib/index.js')
 *   => ['https://esm.sh/left-pad/lib/index.js', 'sha384-deadbeef123']
 */
async function fetchIntegrityHash(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const content = await response.text();
  const hash = crypto.createHash('sha384').update(content).digest('base64');
  return [url, `sha384-${hash}`];
}

async function main() {
  const [graphiql, react, reactDom, graphql] = await Promise.all([
    fetchPackage('graphiql', graphiqlVersion),
    fetchPackage('react', 'latest'),
    fetchPackage('react-dom', 'latest'),
    fetchPackage('graphql', 'latest'),
  ]);
  if (!graphiql.version.startsWith('6.')) {
    throw new Error(
      `The v6 CDN template cannot use graphiql@${graphiql.version}`,
    );
  }

  const graphiqlReact = await fetchPackage(
    '@graphiql/react',
    graphiql.dependencies['@graphiql/react'],
  );
  const versions = {
    graphiql: graphiql.version,
    react: react.version,
    'react-dom': reactDom.version,
    graphql: graphql.version,
    '@graphiql/react': graphiqlReact.version,
    '@graphiql/toolkit': graphiqlReact.dependencies['@graphiql/toolkit'],
    'monaco-graphql': graphiqlReact.dependencies['monaco-graphql'],
    'graphql-language-service':
      graphiqlReact.dependencies['graphql-language-service'],
    'monaco-editor': monacoEditorVersion,
  };
  const cdnUrl = packageName =>
    `https://esm.sh/${packageName}@${versions[packageName]}`;

  // JS
  const imports = {
    react: cdnUrl('react'),
    'react/': `${cdnUrl('react')}/`,
    'react-dom': cdnUrl('react-dom'),
    'react-dom/': `${cdnUrl('react-dom')}/`,
    graphiql: `${cdnUrl('graphiql')}?standalone&external=react,react-dom,@graphiql/react,graphql`,
    'graphiql/': `${cdnUrl('graphiql')}/`,
    '@graphiql/react': `${cdnUrl('@graphiql/react')}?standalone&external=react,react-dom,graphql,@graphiql/toolkit`,
    '@graphiql/toolkit': `${cdnUrl('@graphiql/toolkit')}?standalone&external=graphql`,
    graphql: cdnUrl('graphql'),
  };

  const integrity = Object.fromEntries(
    await Promise.all(
      [
        cdnUrl('react'),
        cdnUrl('react-dom'),
        cdnUrl('graphiql'),
        `${cdnUrl('graphiql')}?standalone&external=react,react-dom,@graphiql/react,graphql`,
        `${cdnUrl('@graphiql/react')}?standalone&external=react,react-dom,graphql,@graphiql/toolkit`,
        `${cdnUrl('@graphiql/toolkit')}?standalone&external=graphql`,
        cdnUrl('graphql'),
      ].map(fetchIntegrityHash),
    ),
  );

  let importMap = JSON.stringify({ imports, integrity }, null, 2);

  // CSS
  const graphiqlCss = `${cdnUrl('graphiql')}/dist/style.css`;
  const graphiqlCssHash = (await fetchIntegrityHash(graphiqlCss))[1];

  // Generate index.html
  const templatePath = path.join(
    import.meta.dirname,
    '../../resources/index.html.template',
  );
  const template = fs.readFileSync(templatePath, 'utf8');

  // Indent import map to be correctly formatted in index.html
  const indent = lines =>
    lines
      .split('\n')
      .map(line => `      ${line}`)
      .join('\n');
  importMap = indent(importMap);

  const output = template
    .replace('{{IMPORTMAP}}', importMap)
    .replace('{{GRAPHIQL_CSS_URL}}', graphiqlCss)
    .replace('{{GRAPHIQL_CSS_INTEGRITY}}', graphiqlCssHash)
    .replaceAll(
      '{{MONACO_EDITOR_WORKER_URL}}',
      `${cdnUrl('monaco-editor')}/editor/editor.worker.js?worker`,
    )
    .replaceAll(
      '{{JSON_WORKER_URL}}',
      `${cdnUrl('monaco-editor')}/languages/features/json/json.worker.js?worker`,
    )
    .replaceAll(
      '{{GRAPHQL_WORKER_URL}}',
      `${cdnUrl('monaco-graphql')}/esm/graphql.worker.js?worker&deps=monaco-editor@${versions['monaco-editor']},graphql-language-service@${versions['graphql-language-service']}`,
    );

  process.stdout.write(output);
}

main();
