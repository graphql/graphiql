import { FC, useEffect, useRef } from 'react';
import { useMonaco } from '../stores';
import { useGraphiQL, useGraphiQLActions } from './provider';
import { getOrCreateModel } from '../utility/create-editor';
import { cleanupDisposables, cn, pick } from '../utility';
import { Button } from './button';
import './operation-diff-editor.css';

const ORIGINAL_URI = (id: string) => `${id}diff-original.graphql`;
const MODIFIED_URI = (id: string) => `${id}diff-modified.graphql`;

export const OperationDiffEditor: FC<{ className?: string }> = ({
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setDiffOverlay } = useGraphiQLActions();
  const { diffOverlay, queryEditor, monacoTheme, uriInstanceId } = useGraphiQL(
    pick('diffOverlay', 'queryEditor', 'monacoTheme', 'uriInstanceId'),
  );
  const { monaco } = useMonaco();

  useEffect(() => {
    if (!monaco || !diffOverlay || !containerRef.current) {
      return;
    }
    const original = getOrCreateModel({
      uri: ORIGINAL_URI(uriInstanceId),
      value: '',
    });
    const modified = getOrCreateModel({
      uri: MODIFIED_URI(uriInstanceId),
      value: '',
    });
    original.setValue(queryEditor?.getValue() ?? '');
    modified.setValue(diffOverlay.modifiedQuery);

    const editor = monaco.editor.createDiffEditor(containerRef.current, {
      theme: monacoTheme,
      readOnly: true,
      originalEditable: false,
      renderSideBySide: true,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontFamily: '"Fira Code"',
      fontLigatures: true,
      fontSize: 15,
    });
    editor.setModel({ original, modified });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDiffOverlay(null);
      }
    };
    const node = containerRef.current;
    node.addEventListener('keydown', onKeyDown);

    return cleanupDisposables([
      editor,
      { dispose: () => node.removeEventListener('keydown', onKeyDown) },
    ]);
    // Models are intentionally NOT disposed — they're reused on the next open.
  }, [
    monaco,
    diffOverlay,
    monacoTheme,
    uriInstanceId,
    queryEditor,
    setDiffOverlay,
  ]);

  if (!diffOverlay) {
    return null;
  }

  return (
    <div className={cn('graphiql-diff-editor', className)}>
      <div className="graphiql-diff-editor-header">
        <span className="graphiql-diff-editor-label">
          Compare with <strong>{diffOverlay.label}</strong>
        </span>
        <div className="graphiql-diff-editor-actions">
          <Button type="button" onClick={() => setDiffOverlay(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              diffOverlay.onApply();
              setDiffOverlay(null);
            }}
          >
            Apply
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        className="graphiql-diff-editor-monaco"
      />
    </div>
  );
};
