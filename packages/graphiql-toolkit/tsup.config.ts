import { defineConfig, Options } from 'tsup';

const opts: Options = {
  entry: ['src/**/*.ts', '!**/__tests__'],
  bundle: false,
  clean: true,
  dts: true,
};

export default defineConfig([
  {
    ...opts,
    format: 'esm',
    outDir: 'dist/esm',
  },
  {
    ...opts,
    format: 'cjs',
    outDir: 'dist/cjs',
  },
]);
