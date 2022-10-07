import { startServer } from 'graphql-language-service-server';
import { workspace } from 'vscode';

// The npm scripts are configured to only build this once before
// watching the extension, so please restart the extension debugger for changes!

const start = () => {
  const { enableLegacyDecorators } = 
    workspace.getConfiguration('vscode-graphql');

  startServer({
    method: 'node',
    enableLegacyDecorators,
  })
    .then(() => {})
    .catch(err => {
      console.error(err);
    });
};

start();
