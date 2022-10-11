const { build } = require('esbuild');
const [, , arg] = process.argv;

const logger = console;

const isWatchMode = arg === '--watch';

build({
  entryPoints: ['src/extension.ts', 'src/server/index.ts'],
  bundle: true,
  minify: arg === '--minify',
  platform: 'node',
  outdir: 'out/',
  external: ['vscode'],
  format: 'cjs',
  sourcemap: true,
  watch: isWatchMode,
})
  .then(({ errors, warnings }) => {
    if (warnings.length) {
      logger.warn(...warnings);
    }
    if (errors.length) {
      logger.error(...errors);
    }

    logger.log('successfully bundled vscode-graphql 🚀');

    if (isWatchMode) {
      logger.log('watching... 🕰');
    } else {
      process.exit();
    }
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });
