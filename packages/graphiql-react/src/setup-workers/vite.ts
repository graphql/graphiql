import jsonWorkerUrl from 'monaco-editor/esm/vs/language/json/json.worker.js?worker&url';
import editorWorkerUrl from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&url';
import graphQLWorkerUrl from 'monaco-graphql/esm/graphql.worker.js?worker&url';

/**
 * Setup Monaco Editor workers for Vite.
 *
 * Vite doesn’t support instantiating web workers directly from bare module imports like this:
 * ```
 * new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url))
 * ```
 * Vite needs to know ahead of time that you are loading a web worker.
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    // eslint-disable-next-line no-console
    console.info('setup-workers/vite', { label });
    switch (label) {
      case 'json':
        return new Worker(new URL(jsonWorkerUrl, import.meta.url), {
          type: 'module',
        });
      case 'graphql': {
        return new Worker(new URL(graphQLWorkerUrl, import.meta.url), {
          type: 'module',
        });
      }
    }
    return new Worker(new URL(editorWorkerUrl, import.meta.url), {
      type: 'module',
    });
  }
};
