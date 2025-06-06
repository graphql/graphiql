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
      .slice(1, -1)
      .join('\n')
      // To replace two or more spaces and everything until the end of the line
      // Because kb fails on CI
      .replaceAll(/\s{2,}.*/gm, '');
    expect(output).toMatchInlineSnapshot(`
      "transforming...
      ✓ 1108 modules transformed.
      rendering chunks...
      computing gzip size...
      dist/index.html
      dist/workers/graphql.js
      dist/assets/codicon.ttf
      dist/workers/standalone.js
      dist/workers/editor.worker.js
      dist/workers/json.worker.js
      dist/workers/graphql.worker.js
      dist/workers/ts.worker.js
      dist/assets/index.css
      dist/assets/graphql.js
      dist/assets/typescript.js
      dist/assets/index.js
      dist/assets/tsMode.js
      dist/assets/jsonMode.js
      dist/assets/graphqlMode.js
      dist/index.js"
    `);
  }, 50_000);
});
