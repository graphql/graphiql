import { defineConfig, Options } from 'tsup';

const opts: Options = {
  entry: ['src/**/*.ts', '!**/__tests__'],
  bundle: false,
  clean: true,
  minifySyntax: true,
};

export default defineConfig([
  {
    ...opts,
    format: 'esm',
    outDir: 'dist/esm',
    outExtension: () => ({ js: '.js' }),
    env: {
      USE_IMPORT: 'true',
    },
    dts: true,
  },
  {
    ...opts,
    format: 'cjs',
    outDir: 'dist/cjs',
    env: {
      USE_IMPORT: 'false',
    },
  },
]);
