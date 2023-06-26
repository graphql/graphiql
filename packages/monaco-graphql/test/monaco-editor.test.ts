import { $ } from 'execa';

describe('monaco-editor', () => {
  it('should include in bundle only graphql/json languages', async () => {
    const { stdout } =
      await $`yarn workspace example-monaco-graphql-react-vite build`;
    const lines = stdout.split('\n');
    expect(lines[3].includes('1092 modules transformed.')).toBe(true);
    expect(lines[4]).toBe('rendering chunks...');
    expect(lines[5]).toBe('computing gzip size...');
    expect(lines[6].startsWith('dist/index.html')).toBe(true);
    expect(lines[7].startsWith('dist/assets/codicon-')).toBe(true);
    expect(lines[8].startsWith('dist/assets/index-')).toBe(true);
    expect(lines[9].startsWith('dist/assets/graphql-')).toBe(true);
    expect(lines[10].startsWith('dist/assets/jsonMode-')).toBe(true);
    expect(lines[11].startsWith('dist/assets/graphqlMode-')).toBe(true);
    expect(lines[12].startsWith('dist/assets/index-')).toBe(true);
    expect(lines[13].startsWith('✓ built in ')).toBe(true);
  }, 25_000);
});
