import { $ } from 'execa';

// eslint-disable-next-line no-control-regex
const ANSI_COLOR_REGEX = /\u001b\[\d+m/g;

describe('monaco-editor', () => {
  it('should include in bundle only graphql/json languages', async () => {
    const { stdout } =
      await $`yarn workspace example-monaco-graphql-react-vite build`;
    // When process.env.CI is set, stdout contain ANSI color codes, and vite doesn't have
    // `--no-colors` flag
    const output = stdout
      .replaceAll(ANSI_COLOR_REGEX, '')
      .split('\n')
      .slice(2, -1)
      .join('\n');
    expect(output).toMatchInlineSnapshot(`
      "transforming...
      ✓ 902 modules transformed.
      rendering chunks...
      computing gzip size...
      dist/index.html                      0.69 kB │ gzip:     0.39 kB
      dist/workers/graphql.js             61.66 kB
      dist/assets/codicon.ttf             79.57 kB
      dist/workers/standalone.js          99.14 kB
      dist/workers/editor.worker.js      437.43 kB
      dist/workers/json.worker.js        709.37 kB
      dist/workers/graphql.worker.js     928.08 kB
      dist/workers/ts.worker.js       10,652.33 kB
      dist/assets/index.css              154.00 kB │ gzip:    21.96 kB
      dist/assets/graphql.js               4.15 kB │ gzip:     1.59 kB
      dist/assets/typescript.js            9.11 kB │ gzip:     2.95 kB
      dist/assets/index.js                22.57 kB │ gzip:     5.39 kB
      dist/assets/tsMode.js               42.21 kB │ gzip:     8.24 kB
      dist/assets/jsonMode.js             85.51 kB │ gzip:    15.62 kB
      dist/assets/graphqlMode.js         247.09 kB │ gzip:    43.82 kB
      dist/index.js                    6,403.40 kB │ gzip: 1,177.66 kB"
    `);
  }, 40_000);
});
