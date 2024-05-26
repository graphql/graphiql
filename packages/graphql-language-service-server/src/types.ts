import type { GraphQLExtensionDeclaration, loadConfig } from 'graphql-config';
export type LoadConfigOptions = Parameters<typeof loadConfig>[0];
import { GraphQLConfig } from 'graphql-config';

import { parseDocument } from './parseDocument';
import { SupportedExtensionsEnum } from './constants';

export interface ServerOptions {
  /**
   * socket, streams, or node (ipc).
   * @default 'node'
   */
  method?: 'socket' | 'stream' | 'node';
  /**
   * (socket only) port for the LSP server to run on. required if using method socket
   */
  port?: number;
  /**
   * (socket only) hostname for the LSP server to run on.
   * @default '127.0.0.1'
   */
  hostname?: string;
  /**
   * (socket only) encoding for the LSP server to use.
   * @default 'utf-8'
   */
  encoding?: 'utf-8' | 'ascii';
  /**
   * `LoadConfigOptions` from `graphql-config@3` to use when we `loadConfig()`
   * uses process.cwd() by default for `rootDir` option.
   * you can also pass explicit `filepath`, add extensions, etc
   */
  loadConfigOptions?: LoadConfigOptions;
  /**
   * @deprecated use loadConfigOptions.rootDir now) the directory where graphql-config is found
   */
  configDir?: string;
  /**
   * @deprecated use loadConfigOptions.extensions
   */
  extensions?: GraphQLExtensionDeclaration[];
  /**
   * allowed file extensions for embedded graphql, used by the parser.
   * note that with vscode, this is also controlled by manifest and client configurations.
   * do not put full-file graphql extensions here!
   * @default ['.js', '.jsx', '.tsx', '.ts', '.mjs']
   */
  fileExtensions?: ReadonlyArray<SupportedExtensionsEnum>;
  /**
   * allowed file extensions for full-file graphql, used by the parser.
   * @default ['graphql', 'graphqls', 'gql'  ]
   */
  graphqlFileExtensions?: string[];
  /**
   * pre-existing GraphQLConfig primitive, to override `loadConfigOptions` and related deprecated fields
   */
  config?: GraphQLConfig;
  /**
   * custom, multi-language parser used by the LSP server.
   * detects extension from uri and decides how to parse it.
   * uses graphql.parse() by default
   * response format is designed to assist with developing LSP tooling around embedded language support
   */
  parser?: typeof parseDocument;
  /**
   * the temporary directory that the server writes to for logs and caching schema
   */
  tmpDir?: string;

  /**
   * debug mode
   *
   * same as with the client reference implementation, the debug setting controls logging output
   * this allows all logger.info() messages to come through. by default, the highest level is warn
   */
  debug?: true;
}
