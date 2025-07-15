/**
 * Setup Monaco Editor workers for Webpack/Turbopack projects like Next.js.
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    // eslint-disable-next-line no-console
    console.info('setup-workers/webpack', { label });
    switch (label) {
      case 'json':
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/language/json/json.worker.js',
            import.meta.url,
          ),
        );
      case 'graphql':
        return new Worker(
          new URL('monaco-graphql/esm/graphql.worker.js', import.meta.url),
        );
    }
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
    );
  },
};
