const { build } = require('esbuild');
const { copyFile } = require('node:fs/promises');
const { createRequire } = require('node:module');
const [, , arg] = process.argv;

const logger = console;

logger.log('bundling vscode-graphql');

build({
  entryPoints: [
    'src/extension.ts',
    'src/serverIpc/index.ts',
    'src/serverStdio/index.ts',
  ],
  bundle: true,
  minify: arg === '--minify',
  platform: 'node',
  target: 'node20.19',
  outdir: 'out/',
  format: 'cjs',
  sourcemap: true,
  external: [
    // Optional Glimmer compiler loaded by GraphQL Tools.
    'content-tag',
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
    'react',
    'react-dom/server',
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
    'handlebars',
    'ejs',
    'vscode',
    'velocityjs',
    'dustjs-linkedin',
    'atpl',
    'liquor',
    'twig',
  ],
})
  .then(async ({ errors, warnings }) => {
    if (warnings.length) {
      logger.warn(...warnings);
    }
    if (errors.length) {
      logger.error(...errors);
    }

    // The bundled compiler resolves ../astro.wasm from each server entry point.
    const requireFromServer = createRequire(
      require.resolve('graphql-language-service-server/package.json'),
    );
    await copyFile(
      requireFromServer.resolve('@astrojs/compiler/astro.wasm'),
      'out/astro.wasm',
    );

    logger.log('successfully bundled vscode-graphql 🚀');
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });
