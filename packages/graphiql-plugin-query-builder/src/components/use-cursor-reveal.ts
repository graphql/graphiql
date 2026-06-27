import { useEffect, useRef, useState } from 'react';
import { segmentsEqual, type PathSegment } from '../lib/ast-path';

/**
 * Reveals a tree node as the editor cursor moves onto it or a descendant:
 * auto-expands it when it's an ancestor of the cursor's field, and (only when
 * the cursor lands exactly on it) flashes it, scrolls it into view, and marks it
 * as the current node so the row can show a persistent highlight. Ancestors
 * expand but neither flash nor highlight, to keep the "you are here" signal on
 * the one field the cursor sits in. Shared by field rows and inline-fragment
 * rows so both react to the cursor.
 */
export function useCursorReveal(
  fullPath: PathSegment[],
  cursorPath: PathSegment[] | undefined,
  setExpanded: (value: boolean) => void,
) {
  const onCursorPath =
    cursorPath !== undefined &&
    cursorPath.length >= fullPath.length &&
    fullPath.every((seg, i) => segmentsEqual(cursorPath[i]!, seg));
  const isAncestor = onCursorPath && cursorPath.length > fullPath.length;
  const isTarget = onCursorPath && cursorPath.length === fullPath.length;

  const nodeRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);

  // Re-assert on every cursor move (depend on the `cursorPath` array identity,
  // not just `isAncestor`): otherwise a node that's already an ancestor when it
  // gets collapsed never re-expands as the cursor moves deeper, since
  // `isAncestor` stays true and the effect wouldn't re-run.
  useEffect(() => {
    if (isAncestor) {
      setExpanded(true);
    }
  }, [cursorPath, isAncestor, setExpanded]);

  // Depend on the `cursorPath` array identity, not its contents: the editor
  // hands us a fresh array on every cursor event, so re-placing the cursor on
  // the same field re-flashes it (handy for getting your bearings).
  useEffect(() => {
    if (!isTarget) {
      return;
    }
    setFlash(true);
    // Scroll the header row into view, not the whole node. For a composite field
    // the node also wraps its expanded children, so centering the node would
    // center that tall subtree and leave the field's own row off-center. The
    // first child is the row (the children, if any, follow it). Centered
    // vertically so it doesn't land under the sticky operation header.
    const row = nodeRef.current?.firstElementChild ?? nodeRef.current;
    row?.scrollIntoView({ block: 'center' });
    const timer = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(timer);
  }, [cursorPath, isTarget]);

  return { flash, current: isTarget, nodeRef };
}
