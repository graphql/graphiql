import { $ } from 'execa';

// eslint-disable-next-line no-control-regex
const ANSI_COLOR_REGEX = /\u001b\[\d+m/g;

describe('monaco-editor', () => {
  it('should include in bundle only graphql/json languages', async () => {
    const { stdout } =
      await $`yarn workspace example-monaco-graphql-react-vite build`;
    // When process.env.CI is set, stdout contain ANSI color codes, and vite doesn't have
    // `--no-colors` flag
    const lines = stdout.replaceAll(ANSI_COLOR_REGEX, '').split('\n');
    expect(lines[0]).toBe('$ vite build');
    expect(lines[1]).toMatch(' building for production...');
    expect(lines[2]).toBe('transforming...');
    expect(lines[3]).toMatch('✓ 1093 modules transformed.');
    expect(lines[4]).toBe('rendering chunks...');
    expect(lines[5]).toBe('computing gzip size...');
    expect(lines[6]).toMatch('dist/index.html');
    expect(lines[7]).toMatch('dist/assets/codicon-');
    expect(lines[8]).toMatch('dist/assets/index-');
    expect(lines[9]).toMatch('dist/assets/graphql-');
    expect(lines[10]).toMatch('dist/assets/jsonMode-');
    expect(lines[11]).toMatch('dist/assets/graphqlMode-');
    expect(lines[12]).toMatch('dist/assets/index-');
    expect(lines[13]).toMatch('✓ built in ');
  }, 30_000);
});
