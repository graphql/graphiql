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
  format: 'cjs',
  sourcemap: true,
  external: [
    // Avoid bundling @astrojs/compiler since esbuild can't handle WASM correctly
    '@astrojs/compiler',
    'astrojs-compiler-sync',
    // Avoid bundling @vue/compiler-sfc's dynamic dependencies
    'squirrelly',
    'teacup',
    'coffee-script',
    'marko',
    'slm',
    'vash',
    'plates',
    'babel-core',
    'htmling',
    'ractive',
    'mote',
    'eco',
    'jqtpl',
    'hamljs',
    'jazz',
    'hamlet',
    'whiskers',
    'haml-coffee',
    'hogan.js',
    'templayed',
    'walrus',
    'mustache',
    'just',
    'ect',
    'toffee',
    'twing',
    'dot',
    'bracket-template',
    'vscode',
    'velocityjs',
    'dustjs-linkedin',
    'atpl',
    'liquor',
    'twig',
  ],
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
