import { createStore } from 'zustand';
import type { MonacoGraphQLAPI } from 'monaco-graphql';
import { createBoundedUseStore } from '../utility';
import {
  JSON_DIAGNOSTIC_OPTIONS,
  MONACO_GRAPHQL_DIAGNOSTIC_SETTINGS,
  MONACO_THEME_NAME,
  MONACO_THEME_DATA,
} from '../constants';

interface MonacoStoreType {
  monaco?: typeof import('monaco-editor');
  monacoGraphQL?: MonacoGraphQLAPI;
  actions: {
    initialize: () => Promise<void>;
  };
}

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
async function patchFirefox() {
  const { MouseTargetFactory } = await import(
    // @ts-expect-error -- no types
    'monaco-editor/esm/vs/editor/browser/controller/mouseTarget'
  );
  const originalFn = MouseTargetFactory._doHitTestWithCaretPositionFromPoint;

  MouseTargetFactory._doHitTestWithCaretPositionFromPoint = (
    ...args: any[]
  ) => {
    const [ctx, coords] = args;
    const hitResult = ctx.viewDomNode.ownerDocument.caretPositionFromPoint(
      coords.clientX,
      coords.clientY,
    );
    if (hitResult) {
      // Delegate to the original function if hitResult is valid
      const result = originalFn(...args);
      return result;
    }
    // We must return an object with `type: 0` to avoid the following error:
    // Uncaught Error: can't access property "type", result is undefined
    return { type: 0 };
  };
}

/**
 * Dynamically load `monaco-editor` and `monaco-graphql` in `useEffect` after component renders.
 *
 * **Do not convert these to static `import` statements.**
 * In SSR (e.g., Next.js), static imports run on the server
 * where `window` is undefined and trigger an error.
 */
export const monacoStore = createStore<MonacoStoreType>((set, get) => ({
  actions: {
    async initialize() {
      const isInitialized = Boolean(get().monaco);
      if (isInitialized) {
        return;
      }
      const [monaco, { initializeMode }] = await Promise.all([
        /**
         * Can't use `monaco-graphql/esm/monaco-editor` due error in esm.sh example:
         * Uncaught TypeError: Cannot read properties of undefined (reading 'jsonDefaults')
         */
        // @ts-expect-error -- no types
        import('monaco-editor/esm/vs/editor/edcore.main'),
        import('monaco-graphql/esm/lite'),
      ]);
      globalThis.__MONACO = monaco;
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions(
        JSON_DIAGNOSTIC_OPTIONS,
      );
      monaco.editor.defineTheme(MONACO_THEME_NAME.dark, MONACO_THEME_DATA.dark);
      monaco.editor.defineTheme(
        MONACO_THEME_NAME.light,
        MONACO_THEME_DATA.light,
      );
      if (navigator.userAgent.includes('Firefox/')) {
        void patchFirefox();
      }
      const monacoGraphQL = initializeMode({
        diagnosticSettings: MONACO_GRAPHQL_DIAGNOSTIC_SETTINGS,
      });
      set({ monaco, monacoGraphQL });
    },
  },
}));

export const useMonaco = createBoundedUseStore(monacoStore);
