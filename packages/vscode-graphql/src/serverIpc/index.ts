// this lives in the same monorepo! most errors you see in
// vscode that aren't highlighting or bracket completion
// related are coming from our LSP server
import { startServer } from 'graphql-language-service-server';

// The npm scripts are configured to only build this once before
// watching the extension, so please restart the extension debugger for changes!

async function start() {
  try {
    await startServer({ method: 'node' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

void start();
