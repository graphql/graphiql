import { useGraphiQL } from '@graphiql/react';
import { parse } from 'graphql';
import { useEffect, useState } from 'react';
import { fieldPathAtOffset } from '../lib/schema-walk';

// monaco-editor's `CursorChangeReason.Explicit` — a cursor move the user made
// directly (mouse or keyboard), as opposed to one caused by a content change.
// Inlined as a literal to avoid pulling monaco-editor in just for the enum.
const CURSOR_CHANGE_EXPLICIT = 3;

/**
 * Tracks the field path under the editor cursor so the tree can expand down to
 * it. Subscribes to the query editor directly (debounced to avoid thrashing
 * while typing), ignoring cursor resets caused by our own writes.
 *
 * Calls `useGraphiQL` internally so selector usage stays identical to what the
 * component did before extraction.
 */
export function useCursorPath(): string[] {
  const queryEditor = useGraphiQL(state => state.queryEditor);

  const [cursorPath, setCursorPath] = useState<string[]>([]);
  useEffect(() => {
    if (!queryEditor) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const recompute = () => {
      const model = queryEditor.getModel();
      const pos = queryEditor.getPosition();
      if (!model || !pos) {
        return;
      }
      const offset = model.getOffsetAt(pos);
      try {
        setCursorPath(fieldPathAtOffset(parse(model.getValue()), offset));
      } catch {
        // Unparseable in-progress edit — leave the path as-is.
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(recompute, 80);
    };
    const disposable = queryEditor.onDidChangeCursorPosition(e => {
      // Only follow genuine user navigation. Our own writes reset and restore
      // the cursor (setValue -> ContentFlush, setPosition -> NotSet), which
      // would otherwise re-reveal — flash, scroll, expand — whatever field the
      // cursor sits on every time the user edits something in the panel.
      if (e.reason === CURSOR_CHANGE_EXPLICIT) {
        schedule();
      }
    });
    recompute();
    return () => {
      clearTimeout(timer);
      disposable.dispose();
    };
  }, [queryEditor]);

  return cursorPath;
}
