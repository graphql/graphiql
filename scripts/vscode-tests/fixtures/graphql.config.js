/* oxlint-disable unicorn/prefer-node-protocol */
// This fixture also records failures on VS Code 1.63's Node 14.16 runtime.
const fs = require('fs');
const path = require('path');

fs.appendFileSync(
  path.join(__dirname, 'runtime-versions.jsonl'),
  JSON.stringify({ pid: process.pid, versions: process.versions }) + '\n',
);

const url = process.env.GRAPHIQL_TEST_SERVER_URL;
module.exports = {
  schema:
    process.env.GRAPHIQL_TEST_MODE === 'execution'
      ? { [url]: { headers: { 'x-runtime-test': 'schema' } } }
      : './schema.graphql',
  documents:
    process.env.GRAPHIQL_TEST_MODE === 'execution'
      ? ['./operation.graphql', './fragment.graphql', './subscription.graphql']
      : ['./*.{graphql,ts,vue,svelte,astro}'],
  extensions: { endpoints: { default: { url } } },
};
