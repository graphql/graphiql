import esbuild from 'rollup-plugin-esbuild';
import { lezer } from '@lezer/generator/rollup';

export default {
  input: 'src/index.ts',
  external: id => id !== 'tslib' && !/^(\.?\/|\w:)/.test(id),
  output: [
    { file: 'dist/index.cjs', format: 'cjs' },
    { dir: './dist', format: 'es' },
  ],
  plugins: [lezer(), esbuild()],
};
