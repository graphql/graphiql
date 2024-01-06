const { build } = require('esbuild');
const [, , arg] = process.argv;

const logger = console;

const isWatchMode = arg === '--watch';

build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  minify: arg === '--minify',
  platform: 'node',
  outdir: 'out/',
  external: [
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
  format: 'cjs',
  sourcemap: true,
  define: { 'import.meta.url': '_importMetaUrl' },
  banner: {
    js: "const _importMetaUrl=require('url').pathToFileURL(__filename)",
  },
})
  .then(({ errors, warnings }) => {
    if (warnings.length) {
      logger.warn(...warnings);
    }
    if (errors.length) {
      logger.error(...errors);
    }

    logger.log('successfully bundled vscode-graphql-execution 🚀');

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
