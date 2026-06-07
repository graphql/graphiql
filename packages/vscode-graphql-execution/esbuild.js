const { build } = require('esbuild');
const [, , arg] = process.argv;

const logger = console;

const isWatchMode = arg === '--watch';

// `@urql/core` (pinned at 2.6.1) deep-imports `graphql` ESM files by explicit
// `.mjs` path (e.g. `graphql/error/GraphQLError.mjs`). `graphql` 17's `exports`
// map only exposes `.js` deep paths, so esbuild can't resolve the `.mjs` ones.
// Redirect them to the `.js` sibling, which the `exports` map allows. Newer
// `@urql/core` imports `graphql` top-level, so remove this shim once it's
// upgraded past 2.6.1.
const graphqlMjsResolver = {
  name: 'graphql-mjs-resolver',
  setup(buildApi) {
    buildApi.onResolve({ filter: /^graphql\/.*\.mjs$/ }, args => ({
      path: require.resolve(args.path.replace(/\.mjs$/, '.js'), {
        paths: [args.resolveDir],
      }),
    }));
  },
};

build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  minify: arg === '--minify',
  platform: 'node',
  outdir: 'out/',
  plugins: [graphqlMjsResolver],
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
    'handlebars',
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
