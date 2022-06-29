import { useHeaderEditor, UseHeaderEditorArgs } from '../header-editor';

import '../style/codemirror.css';
import '../style/fold.css';

type HeaderEditorProps = UseHeaderEditorArgs & { active?: boolean };

export function HeaderEditor({ active, ...hookArgs }: HeaderEditorProps) {
  const ref = useHeaderEditor(hookArgs);
  return (
    <div
      className="codemirrorWrap"
      // This horrible hack is necessary because a simple display none toggle
      // causes one of the editors' gutters to break otherwise.
      style={{
        position: active ? 'relative' : 'absolute',
        visibility: active ? 'visible' : 'hidden',
      }}
      ref={ref}
    />
  );
}
