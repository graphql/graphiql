import { describe, it, expect } from 'vitest';
import { $ } from 'execa';

// eslint-disable-next-line no-control-regex
const ANSI_COLOR_REGEX = /\u001b\[\d+m/g;

const VOLATILE_LINE =
  /modules transformed|rendering chunks|computing gzip size|transforming|built in|building for production/;

describe('monaco-editor', () => {
  it('should include in bundle only graphql/json languages', async () => {
    const { stdout } =
      await $`yarn workspace example-monaco-graphql-react-vite build`;
    // When process.env.CI is set, stdout contains ANSI color codes, and vite doesn't have
    // `--no-colors` flag
    const files = stdout
      .replaceAll(ANSI_COLOR_REGEX, '')
      .split('\n')
      .map(line => line.replaceAll(/\s{2,}.*/gm, '').trim())
      .filter(line => line && !VOLATILE_LINE.test(line));
    expect(files).toMatchInlineSnapshot(`
      [
        "dist/index.html",
        "dist/workers/graphql.js",
        "dist/assets/codicon.ttf",
        "dist/workers/standalone.js",
        "dist/workers/editor.worker.js",
        "dist/workers/json.worker.js",
        "dist/workers/graphql.worker.js",
        "dist/workers/ts.worker.js",
        "dist/assets/index.css",
        "dist/assets/graphql.js",
        "dist/assets/typescript.js",
        "dist/assets/index.js",
        "dist/assets/tsMode.js",
        "dist/assets/jsonMode.js",
        "dist/assets/graphqlMode.js",
        "dist/index.js",
      ]
    `);
  }, 60_000);
});
