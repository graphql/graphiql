/**
 * Can't use `monaco-graphql/esm/monaco-editor` due error in esm.sh example:
 * Uncaught TypeError: Cannot read properties of undefined (reading 'jsonDefaults')
 */

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from 'monaco-editor';
// @ts-expect-error -- no types
import { MouseTargetFactory } from 'monaco-editor/esm/vs/editor/browser/controller/mouseTarget.js';

/**
 * Patch for Firefox compatibility:
 *
 * Fixes:
 *    Uncaught Error: can't access property "offsetNode", hitResult is null
 *
 * Related issues:
 * - https://github.com/graphql/graphiql/issues/4041
 * - https://github.com/microsoft/monaco-editor/issues/4679
 * - https://github.com/microsoft/monaco-editor/issues/4527
 *
 * The suggested patch https://github.com/microsoft/monaco-editor/issues/4679#issuecomment-2406284453
 * no longer works in Mozilla Firefox
 */
if (navigator.userAgent.includes('Firefox')) {
  const originalFn = MouseTargetFactory._doHitTestWithCaretPositionFromPoint;

  // @ts-expect-error -- internal override of Monaco method
  MouseTargetFactory._doHitTestWithCaretPositionFromPoint = (...args) => {
    const [ctx, coords] = args;
    const hitResult = ctx.viewDomNode.ownerDocument.caretPositionFromPoint(
      coords.clientX,
      coords.clientY,
    );
    if (hitResult) {
      // Delegate to original function if hitResult is valid
      const result = originalFn(...args);
      return result;
    }
    // We must return an object with `type: 0` to avoid the following error:
    // Uncaught Error: can't access property "type", result is undefined
    return { type: 0 };
  };
}
