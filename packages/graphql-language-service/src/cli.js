/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import yargs from 'yargs';
import client from './client';
import {Logger, startServer} from 'graphql-language-service-server';
import watchman from 'fb-watchman';

const {argv} = yargs
  .usage(
    'GraphQL Language Service Command-Line Interface.\n' +
      'Usage: $0 <command> <file>\n' +
      '    [-h | --help]\n' +
      '    [-c | --configDir] {configDir}\n' +
      '    [-t | --text] {textBuffer}\n' +
      '    [-f | --file] {filePath}\n' +
      '    [-s | --schema] {schemaPath}\n' +
      '    [-m | --method] {method}\n' +
      '    [-p | --port] {port}\n',
  )
  .help('h')
  .alias('h', 'help')
  .demand(
    1,
    'At least one command is required.\n' +
      'Commands: "server, validate, autocomplete, outline"\n',
  )
  .option('t', {
    alias: 'text',
    describe:
      'Text buffer to perform GraphQL diagnostics on.\n' +
      'Will defer to --file option if omitted.\n' +
      'Overrides the --file option, if any.\n',
    type: 'string',
  })
  .option('f', {
    alias: 'file',
    describe:
      'File path to perform GraphQL diagnostics on.\n' +
      'Will be ignored if --text option is supplied.\n',
    type: 'string',
  })
  .option('row', {
    describe:
      'A row number from the cursor location for ' +
      'GraphQL autocomplete suggestions.\n' +
      'If omitted, the last row number will be used.\n',
    type: 'number',
  })
  .option('column', {
    describe:
      'A column number from the cursor location for ' +
      'GraphQL autocomplete suggestions.\n' +
      'If omitted, the last column number will be used.\n',
    type: 'number',
  })
  .option('c', {
    alias: 'configDir',
    describe:
      'Path to the .graphqlrc configuration file.\n' +
      'Walks up the directory tree from the provided config directory, or ' +
      'the current working directory, until a .graphqlrc is found or ' +
      'the root directory is found.\n',
    type: 'string',
  })
  .option('m', {
    alias: 'method',
    describe:
      'A IPC communication method between client and server.\n' +
      'Can be one of: stream, node, socket.\n' +
      'Will default to use a node IPC channel for communication.\n',
    type: 'string',
  })
  .option('p', {
    alias: 'port',
    describe:
      'Port number to communicate via socket.\n' +
      'The port number of a service running inside the IDE that the language ' +
      'service should connect to.\n' +
      'Required if the client communicates via socket connection.\n',
    type: 'number',
  })
  .option('s', {
    alias: 'schemaPath',
    describe: 'a path to schema DSL file\n',
    type: 'string',
  });

const command = argv._.pop();

switch (command) {
  case 'server':
    process.on('uncaughtException', error => {
      process.stdout.write(
        'An error was thrown from GraphQL language service: ' + String(error),
      );
      process.exit(0);
    });
    const watchmanClient = new watchman.Client();
    watchmanClient.capabilityCheck({}, (error, res) => {
      if (error) {
        process.stderr.write(
          `Cannot find installed watchman service with an error: ${error}`,
        );
        process.exit(0);
      }
    });

    const options = {};
    if (argv && argv.port) {
      options.port = argv.port;
    }
    if (argv && argv.method) {
      options.method = argv.method;
    }
    if (argv && argv.configDir) {
      options.configDir = argv.configDir;
    }
    try {
      startServer(options);
    } catch (error) {
      const logger = new Logger();
      logger.error(error);
    }
    break;
  default:
    client(command, argv);
    break;
}

// Exit the process when stream closes from remote end.
process.stdin.on('close', () => {
  process.exit(0);
});
