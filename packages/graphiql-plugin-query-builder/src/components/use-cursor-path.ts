import { useGraphiQL, useMonaco } from '@graphiql/react';
import { parse } from 'graphql';
import { useEffect, useState } from 'react';
import { type DefinitionTarget, type PathSegment } from '../lib/ast-path';
import { cursorContextAtOffset } from '../lib/schema-walk';

export interface CursorContext {
  /** The definition the cursor sits in, or undefined when it's outside one. */
  target: DefinitionTarget | undefined;
  /** Field path under the cursor within `target`; empty when not on a field. */
  path: PathSegment[];
  /**
   * Increments on every explicit cursor move, so consumers can react to any
   * cursor interaction — including one that stays within the same definition.
   */
  moveId: number;
}

const EMPTY_CONTEXT: CursorContext = { target: undefined, path: [], moveId: 0 };

/**
 * Tracks the definition (operation or fragment) and field path under the editor
 * cursor. The builder follows this: moving the cursor into a fragment switches
 * editing to that fragment, and the path expands the tree down to the cursor.
 * Subscribes to the query editor directly (debounced to avoid thrashing while
 * typing), ignoring cursor resets caused by our own writes.
 *
 * Recomputes on both explicit cursor moves and the editor regaining focus. The
 * focus signal matters because clicking back into the editor at the exact spot
 * the cursor already sat fires no cursor-move event, yet should still re-sync
 * the builder to the cursor (e.g. after "Back to query" moved focus away).
 */
export function useCursorContext(): CursorContext {
  const queryEditor = useGraphiQL(state => state.queryEditor);
  const monaco = useMonaco(state => state.monaco);

  const [context, setContext] = useState<CursorContext>(EMPTY_CONTEXT);
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
      let resolved:
        | { target: DefinitionTarget | undefined; path: PathSegment[] }
        | undefined;
      try {
        resolved = cursorContextAtOffset(parse(model.getValue()), offset);
      } catch {
        // Unparseable in-progress edit — leave the context as-is.
        return;
      }
      const next = resolved ?? { target: undefined, path: [] };
      setContext(prev => ({
        target: next.target,
        path: next.path,
        moveId: prev.moveId + 1,
      }));
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(recompute, 80);
    };
    const cursorDisposable = queryEditor.onDidChangeCursorPosition(e => {
      // Only react to explicit (user) cursor moves, not content-flush/programmatic ones.
      if (e.reason === monaco?.editor.CursorChangeReason.Explicit) {
        schedule();
      }
    });
    // Re-sync when the editor regains focus (e.g. clicking back into it after a
    // builder action stole focus), which covers a click at the current cursor.
    const focusDisposable = queryEditor.onDidFocusEditorText(() => {
      schedule();
    });
    recompute();
    return () => {
      clearTimeout(timer);
      cursorDisposable.dispose();
      focusDisposable.dispose();
    };
  }, [queryEditor, monaco]);

  return context;
}
