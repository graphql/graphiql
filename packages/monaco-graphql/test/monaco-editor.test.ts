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
      dist/index.html                          1.84 kB │ gzip:     0.83 kB
      dist/assets/codicon-BA2IlpFX.ttf        79.57 kB
      dist/assets/index-B9YNSYcm.css         154.01 kB │ gzip:    21.97 kB
      dist/assets/graphql-jqsxtyuU.js          4.15 kB │ gzip:     1.59 kB
      dist/assets/typescript-C-tQdLSa.js       9.11 kB │ gzip:     2.96 kB
      dist/assets/index-Dl026pIL.js           22.57 kB │ gzip:     5.39 kB
      dist/assets/tsMode-DC0QyPbI.js          42.22 kB │ gzip:     8.25 kB
      dist/assets/jsonMode-vVGcHoLD.js        85.52 kB │ gzip:    15.63 kB
      dist/assets/graphqlMode-DXMFqJ36.js    247.13 kB │ gzip:    43.84 kB
      dist/assets/index-Cdgf-Cyp.js        6,402.53 kB │ gzip: 1,177.47 kB"
    `);
  }, 30_000);
});
