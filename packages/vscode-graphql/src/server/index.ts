import { startServer } from 'graphql-language-service-server';

// The npm scripts are configured to only build this once before
// watching the extension, so please restart the extension debugger for changes!

const start = () => {
  startServer({
    method: 'node',
  })
    .then(() => {})
    .catch(err => {
      console.error(err);
    });
};

start();
