/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import * as net from 'net';
import { MessageProcessor } from './MessageProcessor';
import { GraphQLConfig, GraphQLExtensionDeclaration } from 'graphql-config';
import {
  IPCMessageReader,
  IPCMessageWriter,
  SocketMessageReader,
  SocketMessageWriter,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-jsonrpc';

import {
  CompletionRequest,
  CompletionResolveRequest,
  DefinitionRequest,
  DidOpenTextDocumentNotification,
  DidSaveTextDocumentNotification,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  ExitNotification,
  HoverRequest,
  InitializeRequest,
  PublishDiagnosticsNotification,
  DidChangeWatchedFilesNotification,
  ShutdownRequest,
  DocumentSymbolRequest,
  PublishDiagnosticsParams,
  WorkspaceSymbolRequest,
  createConnection,
  IConnection,
} from 'vscode-languageserver';

import { Logger } from './Logger';
import {
  parseDocument,
  DEFAULT_SUPPORTED_EXTENSIONS,
  DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
} from './parseDocument';
import { LoadConfigOptions } from './types';

export interface ServerOptions {
  /**
   * port for the LSP server to run on. required if using method socket
   */
  port?: number;
  /**
   * hostname if using socker
   */
  hostname?: string;
  /**
   * socket, streams, or node (ipc). `node` by default.
   */
  method?: 'socket' | 'stream' | 'node';
  /**
   * `LoadConfigOptions` from `graphql-config@3` to use when we `loadConfig()`
   * uses process.cwd() by default for `rootDir` option.
   * you can also pass explicit `filepath`, add extensions, etc
   */
  loadConfigOptions?: LoadConfigOptions;
  /**
   * (deprecated: use loadConfigOptions.rootDir now) the directory where graphql-config is found
   */
  configDir?: string;
  /**
   * (deprecated: use loadConfigOptions.extensions now) array of functions to transform the graphql-config and add extensions dynamically
   */
  extensions?: GraphQLExtensionDeclaration[];
  /**
   * default: ['.js', '.jsx', '.tsx', '.ts', '.mjs']
   * allowed file extensions for embedded graphql, used by the parser.
   * note that with vscode, this is also controlled by manifest and client configurations.
   * do not put full-file graphql extensions here!
   */
  fileExtensions?: string[];
  /**
   * default: ['graphql'] - allowed file extensions for graphql, used by the parser
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
   * the temporary directory that the server writes to for logs and cacheing schema
   */
  tmpDir?: string;
}

/**
 * Make loadConfigOptions
 */
export type MappedServerOptions = Omit<ServerOptions, 'loadConfigOptions'> & {
  loadConfigOptions: Omit<LoadConfigOptions, 'rootDir'> & { rootDir: string };
};

/**
 * Legacy mappings for < 2.5.0
 * @param options {ServerOptions}
 */
const buildOptions = (options: ServerOptions): MappedServerOptions => {
  const serverOptions = { ...options } as MappedServerOptions;
  if (serverOptions.loadConfigOptions) {
    const { extensions } = serverOptions.loadConfigOptions;
    if (!serverOptions.loadConfigOptions.rootDir) {
      if (serverOptions.configDir) {
        serverOptions.loadConfigOptions.rootDir = serverOptions.configDir;
      } else {
        serverOptions.loadConfigOptions.rootDir = process.cwd();
      }
    }
    if (serverOptions.extensions) {
      serverOptions.loadConfigOptions.extensions = [
        ...serverOptions.extensions,
        ...(extensions || []),
      ];
    }
  } else {
    serverOptions.loadConfigOptions = {
      rootDir: options.configDir || process.cwd(),
      extensions: [],
    };
  }
  return serverOptions;
};

/**
 * startServer - initialize LSP server with options
 *
 * @param options {ServerOptions} server initialization methods
 * @returns {Promise<void>}
 */
export default async function startServer(
  options: ServerOptions,
): Promise<void> {
  if (options && options.method) {
    const stderrOnly = options.method === 'stream';
    const logger = new Logger(options.tmpDir, stderrOnly);

    const finalOptions = buildOptions(options);
    let reader;
    let writer;
    switch (options.method) {
      case 'socket':
        // For socket connection, the message connection needs to be
        // established before the server socket starts listening.
        // Do that, and return at the end of this block.
        if (!options.port) {
          process.stderr.write(
            '--port is required to establish socket connection.',
          );
          process.exit(1);
        }

        const port = options.port;
        const hostname = options.hostname;
        const socket = net
          .createServer(client => {
            client.setEncoding('utf8');
            reader = new SocketMessageReader(client);
            writer = new SocketMessageWriter(client);
            client.on('end', () => {
              socket.close();
              process.exit(0);
            });
            return initializeHandlers({
              reader,
              writer,
              logger,
              options: finalOptions,
            }).then(s => {
              s.listen();
            });
          })
          .listen(port, hostname);
        return;
      case 'stream':
        reader = new StreamMessageReader(process.stdin);
        writer = new StreamMessageWriter(process.stdout);
        break;
      case 'node':
      default:
        reader = new IPCMessageReader(process);
        writer = new IPCMessageWriter(process);
        break;
    }

    try {
      const serverWithHandlers = await initializeHandlers({
        reader,
        writer,
        logger,
        options: finalOptions,
      });
      serverWithHandlers.listen();
    } catch (err) {
      logger.error('There was a Graphql LSP handler exception:');
      logger.error(err);
    }
  }
}

type InitializerParams = {
  reader: SocketMessageReader | StreamMessageReader | IPCMessageReader;
  writer: SocketMessageWriter | StreamMessageWriter | IPCMessageWriter;
  logger: Logger;
  options: MappedServerOptions;
};

async function initializeHandlers({
  reader,
  writer,
  logger,
  options,
}: InitializerParams): Promise<IConnection> {
  try {
    const connection = createConnection(reader, writer);

    await addHandlers({ connection, logger, ...options });
    return connection;
  } catch (err) {
    logger.error('There was an error initializing the server connection');
    logger.error(err);
    process.exit(1);
  }
}

function reportDiagnostics(
  diagnostics: PublishDiagnosticsParams | null,
  connection: IConnection,
) {
  if (diagnostics) {
    connection.sendNotification(
      PublishDiagnosticsNotification.type,
      diagnostics,
    );
  }
}

type HandlerOptions = {
  connection: IConnection;
  logger: Logger;
  config?: GraphQLConfig;
  parser?: typeof parseDocument;
  fileExtensions?: string[];
  graphqlFileExtensions?: string[];
  tmpDir?: string;
  loadConfigOptions: LoadConfigOptions;
};

/**
 * take the resultant message connection, and attach the matching `MessageProcessor` instance event handlers
 * similar to languageFeatures.ts in monaco language modes
 *
 * @param options {HandlerOptions}
 */
async function addHandlers({
  connection,
  logger,
  config,
  parser,
  fileExtensions,
  graphqlFileExtensions,
  tmpDir,
  loadConfigOptions,
}: HandlerOptions): Promise<void> {
  const messageProcessor = new MessageProcessor({
    logger,
    config,
    parser,
    fileExtensions: fileExtensions || DEFAULT_SUPPORTED_EXTENSIONS,
    graphqlFileExtensions:
      graphqlFileExtensions || DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
    tmpDir,
    loadConfigOptions,
    connection,
  });

  connection.onNotification(
    DidOpenTextDocumentNotification.type,
    async params => {
      const diagnostics = await messageProcessor.handleDidOpenOrSaveNotification(
        params,
      );
      reportDiagnostics(diagnostics, connection);
    },
  );
  connection.onNotification(
    DidSaveTextDocumentNotification.type,
    async params => {
      const diagnostics = await messageProcessor.handleDidOpenOrSaveNotification(
        params,
      );
      reportDiagnostics(diagnostics, connection);
    },
  );
  connection.onNotification(
    DidChangeTextDocumentNotification.type,
    async params => {
      const diagnostics = await messageProcessor.handleDidChangeNotification(
        params,
      );
      reportDiagnostics(diagnostics, connection);
    },
  );

  connection.onNotification(DidCloseTextDocumentNotification.type, params =>
    messageProcessor.handleDidCloseNotification(params),
  );
  connection.onRequest(ShutdownRequest.type, () =>
    messageProcessor.handleShutdownRequest(),
  );
  connection.onNotification(ExitNotification.type, () =>
    messageProcessor.handleExitNotification(),
  );

  // Ignore cancel requests
  connection.onNotification('$/cancelRequest', () => ({}));

  connection.onRequest(InitializeRequest.type, (params, token) =>
    messageProcessor.handleInitializeRequest(
      params,
      token,
      loadConfigOptions.rootDir,
    ),
  );

  connection.onRequest(CompletionRequest.type, params =>
    messageProcessor.handleCompletionRequest(params),
  );

  connection.onRequest(CompletionResolveRequest.type, item => item);

  connection.onRequest(DefinitionRequest.type, params =>
    messageProcessor.handleDefinitionRequest(params),
  );

  connection.onRequest(HoverRequest.type, params =>
    messageProcessor.handleHoverRequest(params),
  );

  connection.onNotification(DidChangeWatchedFilesNotification.type, params =>
    messageProcessor.handleWatchedFilesChangedNotification(params),
  );

  connection.onRequest(DocumentSymbolRequest.type, params =>
    messageProcessor.handleDocumentSymbolRequest(params),
  );

  connection.onRequest(WorkspaceSymbolRequest.type, params =>
    messageProcessor.handleWorkspaceSymbolRequest(params),
  );

  connection.onDidChangeConfiguration(
    messageProcessor.handleDidChangeConfiguration,
  );
}
