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
}

const EMPTY_CONTEXT: CursorContext = { target: undefined, path: [] };

/**
 * Tracks the definition (operation or fragment) and field path under the editor
 * cursor. The builder follows this: the cursor's definition is the one being
 * edited, and the path expands the tree down to the cursor. Subscribes to the
 * query editor directly (debounced to avoid thrashing while typing), reacting
 * only to explicit user cursor moves — not the cursor resets our own writes
 * cause.
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
      setContext(resolved ?? EMPTY_CONTEXT);
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

  return context;
}
