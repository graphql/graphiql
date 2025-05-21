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
      ✓ 898 modules transformed.
      rendering chunks...
      computing gzip size...
      dist/index.html                 1.81 kB │ gzip:     0.81 kB
      dist/assets/codicon.ttf        79.57 kB
      dist/assets/index.css         154.00 kB │ gzip:    21.96 kB
      dist/assets/graphql.js          4.15 kB │ gzip:     1.59 kB
      dist/assets/typescript.js       9.11 kB │ gzip:     2.95 kB
      dist/assets/index.js           22.57 kB │ gzip:     5.39 kB
      dist/assets/tsMode.js          42.21 kB │ gzip:     8.24 kB
      dist/assets/jsonMode.js        85.51 kB │ gzip:    15.62 kB
      dist/assets/graphqlMode.js    247.09 kB │ gzip:    43.82 kB
      dist/index.js               6,402.52 kB │ gzip: 1,177.43 kB"
    `);
  }, 30_000);
});
