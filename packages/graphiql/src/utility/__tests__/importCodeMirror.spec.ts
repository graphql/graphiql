import { importCodeMirror } from '../importCodeMirror';

describe('importCodeMirror', () => {
  it('should dynamically load codemirror module', async () => {
    const CodeMirror = await importCodeMirror([]);
    expect(typeof CodeMirror === 'function').toBeTruthy();
  });
  it('should dynamically load codemirror module without common addons', async () => {
    const CodeMirror = await importCodeMirror([], { useCommonAddons: false });
    expect(typeof CodeMirror === 'function').toBeTruthy();
  });
});
