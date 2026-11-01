import { defineConfig, Options } from 'tsup';

const opts: Options = {
  entry: ['src/**/*.ts', '!**/__tests__'],
  bundle: false,
  clean: true,
  dts: {
    compilerOptions: {
      // Tsup injects baseUrl into its declaration build using the TypeScript 6 API.
      ignoreDeprecations: '6.0',
    },
  },
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
