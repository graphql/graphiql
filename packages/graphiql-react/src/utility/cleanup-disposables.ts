import type * as monaco from 'monaco-editor';

export function cleanupDisposables(disposables: monaco.IDisposable[]) {
  return () => {
    for (const disposable of disposables) {
      disposable.dispose(); // remove the listener
    }
  };
}
