let isMacOs = false;

if (typeof window === 'object') {
  isMacOs = window.navigator.platform === 'MacIntel';
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

export const commonCodeMirrorAddons = [
  import('codemirror/addon/hint/show-hint'),
  import('codemirror/addon/edit/matchbrackets'),
  import('codemirror/addon/edit/closebrackets'),
  import('codemirror/addon/fold/brace-fold'),
  import('codemirror/addon/fold/foldgutter'),
  import('codemirror/addon/lint/lint'),
  import('codemirror/addon/search/searchcursor'),
  import('codemirror/addon/search/jump-to-line'),
  import('codemirror/addon/dialog/dialog'),
  // @ts-expect-error
  import('codemirror/keymap/sublime'),
];

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
  const allAddons =
    options?.useCommonAddons === false
      ? addons
      : commonCodeMirrorAddons.concat(addons);
  await Promise.all(allAddons.map(addon => addon));
  return CodeMirror;
}
