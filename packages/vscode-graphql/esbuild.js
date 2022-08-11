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
  external: [
    'vscode',
    '@cspotcode/source-map-support', // workaround for https://github.com/cspotcode/node-source-map-support/issues/43
    './transpilers/swc.js', // suppresses warning via ts-node, but we won't be using it, so we can exclude it
  ],
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
