#!/bin/node
'use strict';

function bright(str: string) {
  return `\x1b[1m${str}\x1b[0m`;
}

function yellow(str: string) {
  return `\x1b[33m${str}\x1b[0m`;
}

process.stderr.write(`
  ${bright(yellow('WARNING!'))}

  ${bright('graphql-language-service')} command line interface has been moved to

  ${bright('graphql-language-service-cli')}

  as of version 3.0.0

  
  ${bright('Re-Installation:')}

  yarn:
    ${bright('yarn global remove graphql-language-service')}
    ${bright('yarn global add graphql-language-service-cli')}

  npm:
    ${bright('npm uninstall -g graphql-language-service')}
    ${bright('npm i -g graphql-language-service-cli')}


  ${bright('New Binary Path:')}

  the executable will now be available as ${bright(
    'graphql-lsp',
  )} instead of ${bright('graphql')}

`);
