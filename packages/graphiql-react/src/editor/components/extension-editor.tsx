import { useEffect } from 'react';
import { clsx } from 'clsx';

import { useEditorContext } from '../context';
import {
  useExtensionEditor,
  UseExtensionEditorArgs,
} from '../extension-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/editor.css';

type ExtensionEditorProps = UseExtensionEditorArgs & {
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export function ExtensionEditor({
  isHidden,
  ...hookArgs
}: ExtensionEditorProps) {
  const { extensionEditor } = useEditorContext({
    nonNull: true,
    caller: ExtensionEditor,
  });
  const ref = useExtensionEditor(hookArgs, ExtensionEditor);

  useEffect(() => {
    if (extensionEditor && !isHidden) {
      extensionEditor.refresh();
    }
  }, [extensionEditor, isHidden]);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}
