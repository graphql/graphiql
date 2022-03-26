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
  const { default: CodeMirror } = await import('codemirror');
  const allAddons =
    options?.useCommonAddons === false
      ? addons
      : commonCodeMirrorAddons.concat(addons);
  await Promise.all(allAddons.map(addon => addon));
  return CodeMirror;
}
