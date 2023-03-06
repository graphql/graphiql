import { KeyMap } from './types';

export const DEFAULT_EDITOR_THEME = 'graphiql';
export const DEFAULT_KEY_MAP: KeyMap = 'sublime';

let isMacOs = false;

if (typeof window === 'object') {
  isMacOs = window.navigator.platform.toLowerCase().indexOf('mac') === 0;
}

export const commonKeys = {
  // Persistent search box in Query Editor
  [isMacOs ? 'Cmd-F' : 'Ctrl-F']: 'findPersistent',
  'Cmd-G': 'findPersistent',
  'Ctrl-G': 'findPersistent',

  // Editor improvements
  'Ctrl-Left': 'goSubwordLeft',
  'Ctrl-Right': 'goSubwordRight',
  'Alt-Left': 'goGroupLeft',
  'Alt-Right': 'goGroupRight',
};

/**
 * Dynamically import codemirror and dependencies
 * This works for codemirror 5, not sure if the same imports work for 6
 */
export async function importCodeMirror(
  addons: Promise<any>[],
  options?: { useCommonAddons?: boolean },
) {
  const CodeMirror = await import('codemirror').then(c =>
    // Depending on bundler and settings the dynamic import either returns a
    // function (e.g. parcel) or an object containing a `default` property
    typeof c === 'function' ? c : c.default,
  );
  await Promise.all(
    options?.useCommonAddons === false
      ? addons
      : [
          import('codemirror/addon/hint/show-hint.js'),
          import('codemirror/addon/edit/matchbrackets.js'),
          import('codemirror/addon/edit/closebrackets.js'),
          import('codemirror/addon/fold/brace-fold.js'),
          import('codemirror/addon/fold/foldgutter.js'),
          import('codemirror/addon/lint/lint.js'),
          import('codemirror/addon/search/searchcursor.js'),
          import('codemirror/addon/search/jump-to-line.js'),
          import('codemirror/addon/dialog/dialog.js'),
          // @ts-expect-error
          import('codemirror/keymap/sublime.js'),
          ...addons,
        ],
  );
  return CodeMirror;
}
