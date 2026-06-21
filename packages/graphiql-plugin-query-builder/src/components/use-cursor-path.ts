import { useGraphiQL, useMonaco } from '@graphiql/react';
import { parse } from 'graphql';
import { useEffect, useState } from 'react';
import { type PathSegment } from '../lib/ast-path';
import { fieldPathAtOffset } from '../lib/schema-walk';

/**
 * Tracks the field path under the editor cursor so the tree can expand down to
 * it. Subscribes to the query editor directly (debounced to avoid thrashing
 * while typing), ignoring cursor resets caused by our own writes.
 *
 * Calls `useGraphiQL` internally so selector usage stays identical to what the
 * component did before extraction.
 */
export function useCursorPath(): PathSegment[] {
  const queryEditor = useGraphiQL(state => state.queryEditor);
  const monaco = useMonaco(state => state.monaco);

  const [cursorPath, setCursorPath] = useState<PathSegment[]>([]);
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
      // Only react to explicit (user) cursor moves, not content-flush/programmatic ones.
      if (e.reason === monaco?.editor.CursorChangeReason.Explicit) {
        schedule();
      }
    });
    recompute();
    return () => {
      clearTimeout(timer);
      disposable.dispose();
    };
  }, [queryEditor, monaco]);

  return cursorPath;
}
