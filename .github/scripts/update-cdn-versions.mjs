#!/usr/bin/env node

/**
 * Generates examples/graphiql-cdn/index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

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

function compareVersions(left, right) {
  const leftDash = left.indexOf('-');
  const rightDash = right.indexOf('-');
  const leftCore = leftDash === -1 ? left : left.slice(0, leftDash);
  const rightCore = rightDash === -1 ? right : right.slice(0, rightDash);
  const leftPre = leftDash === -1 ? '' : left.slice(leftDash + 1);
  const rightPre = rightDash === -1 ? '' : right.slice(rightDash + 1);
  const leftParts = leftCore.split('.').map(Number);
  const rightParts = rightCore.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }
  if (!leftPre || !rightPre) {
    return Number(Boolean(rightPre)) - Number(Boolean(leftPre));
  }
  const leftIdentifiers = leftPre.split('.');
  const rightIdentifiers = rightPre.split('.');
  for (
    let index = 0;
    index < Math.max(leftIdentifiers.length, rightIdentifiers.length);
    index++
  ) {
    const leftId = leftIdentifiers[index];
    const rightId = rightIdentifiers[index];
    if (leftId === undefined || rightId === undefined) {
      return Number(leftId !== undefined) - Number(rightId !== undefined);
    }
    if (leftId === rightId) continue;
    const leftNumeric = /^\d+$/.test(leftId);
    const rightNumeric = /^\d+$/.test(rightId);
    if (leftNumeric && rightNumeric) return Number(leftId) - Number(rightId);
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftId < rightId ? -1 : 1;
  }
  return 0;
}

async function resolveVersion(packageName, specifier) {
  if (/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(specifier)) {
    return specifier;
  }
  const { stdout } = await execFileAsync('npm', [
    'view',
    `${packageName}@${specifier}`,
    'version',
    '--json',
  ]);
  const result = JSON.parse(stdout);
  const published = Array.isArray(result) ? result : [result];
  const channel = /\d+\.\d+\.\d+-([a-z]+)(?:\.|$)/i.exec(specifier)?.[1];
  const versions = channel
    ? published.filter(
        version => !version.includes('-') || version.includes(`-${channel}.`),
      )
    : published;
  if (!versions.length) {
    throw new Error(
      `No published version satisfies ${packageName}@${specifier}`,
    );
  }
  return versions.sort(compareVersions).at(-1);
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
    await resolveVersion(
      '@graphiql/react',
      graphiql.dependencies['@graphiql/react'],
    ),
  );
  const [toolkitVersion, monacoGraphqlVersion, languageServiceVersion] =
    await Promise.all([
      resolveVersion(
        '@graphiql/toolkit',
        graphiqlReact.dependencies['@graphiql/toolkit'],
      ),
      resolveVersion(
        'monaco-graphql',
        graphiqlReact.dependencies['monaco-graphql'],
      ),
      resolveVersion(
        'graphql-language-service',
        graphiqlReact.dependencies['graphql-language-service'],
      ),
    ]);
  const versions = {
    graphiql: graphiql.version,
    react: react.version,
    'react-dom': reactDom.version,
    graphql: graphql.version,
    '@graphiql/react': graphiqlReact.version,
    '@graphiql/toolkit': toolkitVersion,
    'monaco-graphql': monacoGraphqlVersion,
    'graphql-language-service': languageServiceVersion,
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
