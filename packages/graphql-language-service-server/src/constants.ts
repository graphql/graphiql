import type { ParserOptions, ParserPlugin } from '@babel/parser';
// Attempt to be as inclusive as possible of source text.
export const PARSER_OPTIONS: ParserOptions = {
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  allowAwaitOutsideFunction: true,
  // important! this allows babel to keep parsing when there are issues
  errorRecovery: true,
  sourceType: 'module',
  strictMode: false,
};

/**
 * .graphql is the officially recommended extension for graphql files
 *
 * .gql and .graphqls are included for compatibility for commonly used extensions
 *
 * GQL is a registered trademark of Google, and refers to Google Query Language.
 * GraphQL Foundation does *not* recommend using this extension or acronym for
 * referring to GraphQL.
 *
 * any changes should also be reflected in vscode-graphql-syntax textmate grammar & package.json
 */
export const DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS = [
  '.graphql',
  '.graphqls',
  '.gql',
];

/**
 * default tag delimiters to use when parsing GraphQL strings (for js/ts/vue/svelte)
 * any changes should also be reflected in vscode-graphql-syntax textmate grammar
 */
export const TAG_MAP: Record<string, true> = {
  graphql: true,
  gql: true,
  graphqls: true,
};

/**
 * default extensions to use when parsing for GraphQL strings
 * any changes should also be reflected in vscode-graphql-syntax textmate grammar & package.json
 */
export const DEFAULT_SUPPORTED_EXTENSIONS = [
  '.js',
  '.cjs',
  '.mjs',
  '.es',
  '.esm',
  '.es6',
  '.ts',
  '.jsx',
  '.tsx',
  '.vue',
  '.svelte',
  // '.astro',
  '.cts',
  '.mts',
] as const;
export type SupportedExtensions = typeof DEFAULT_SUPPORTED_EXTENSIONS;
export type SupportedExtensionsEnum =
  (typeof DEFAULT_SUPPORTED_EXTENSIONS)[number];

/**
 * default plugins to use with babel parser
 */
export const BABEL_PLUGINS: ParserPlugin[] = [
  'asyncDoExpressions',
  'asyncGenerators',
  'bigInt',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'classStaticBlock',
  'doExpressions',
  'decimal',
  'decorators-legacy',
  'destructuringPrivate',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'importAssertions',
  'jsx',
  'logicalAssignment',
  'moduleBlocks',
  'moduleStringNames',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  // ['pipelineOperator', { proposal: 'hack' }],
  'privateIn',
  'regexpUnicodeSets',
  'throwExpressions',
  'topLevelAwait',
];
