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
import startServer from './server/startServer';

const {argv} = yargs
  .usage(
    'GraphQL Language Service Command-Line Interface.\n' +
    'Usage: $0 <command> <file>\n' +
    '    [-h | --help]\n' +
    '    [-c | --config] {configPath}\n' +
    '    [-t | --text] {textBuffer}\n' +
    '    [-f | --file] {filePath}\n' +
    '    [-s | --schema] {schemaPath}\n',
  )
  .help('h')
  .alias('h', 'help')
  .demand(1, 'At least one command is required.\n' +
    'Commands: "server, validate, autocomplete, outline"\n',
  )
  .option('t', {
    alias: 'text',
    describe: 'Text buffer to perform GraphQL diagnostics on.\n' +
      'Will defer to --file option if omitted.\n' +
      'This option is always honored over --file option.\n',
    type: 'string',
  })
  .option('f', {
    alias: 'file',
    describe: 'File path to perform GraphQL diagnostics on.\n' +
      'Will be ignored if --text option is supplied.\n',
    type: 'string',
  })
  .option('row', {
    describe: 'A row number from the cursor location for ' +
      'GraphQL autocomplete suggestions.\n' +
      'If omitted, the last row number will be used.\n',
    type: 'number',
  })
  .option('column', {
    describe: 'A column number from the cursor location for ' +
      'GraphQL autocomplete suggestions.\n' +
      'If omitted, the last column number will be used.\n',
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
    startServer(argv.config.trim());
    break;
  default:
    client(command, argv);
    break;
}

// Exit the process when stream closes from remote end.
process.stdin.on('close', () => {
  process.exit(0);
});
