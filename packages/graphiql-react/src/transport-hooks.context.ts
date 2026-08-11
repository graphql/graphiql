import { createContext, useContext } from 'react';
import type { TransportHookRegistry } from './transport-hooks';

/**
 * Carries the `TransportHookRegistry` for the current provider tree.
 * The value is `null` when no registry exists (legacy `fetcher` path).
 */
export const TransportHookContext = createContext<TransportHookRegistry | null>(
  null,
);

/**
 * The transport-related subset of the plugin context.
 * Present only when the host uses the `transport` prop.
 */
export type PluginTransportContext = {
  /**
   * Register a callback that runs before each request is sent.
   * The callback receives the outgoing `TransportRequest` and must return
   * the (possibly mutated) request, optionally async.
   *
   * Returns a cleanup function; call it to remove the hook.
   *
   * @example
   * ```ts
   * const ctx = useGraphiQLPluginContext();
   * useEffect(() => ctx.transport?.onBeforeSend(req => ({
   *   ...req,
   *   headers: { ...req.headers, 'X-Plugin-Header': '1' },
   * })), []);
   * ```
   */
  onBeforeSend: TransportHookRegistry['onBeforeSend'];

  /**
   * Register a callback that runs after each response is received.
   * Returns a cleanup function; call it to remove the hook.
   */
  onResponse: TransportHookRegistry['onResponse'];

  /**
   * Register a callback that runs when a request fails outright — a thrown
   * `onBeforeSend` hook, a network error — instead of resolving to a
   * `TransportResponse`. Returns a cleanup function; call it to remove the hook.
   */
  onError: TransportHookRegistry['onError'];
};

/**
 * Context available to all plugins mounted inside a `<GraphiQLProvider>`.
 */
export type GraphiQLPluginContext = {
  /**
   * Transport hook registration. Present only when the host supplies a
   * `transport` prop. Access via optional chaining:
   * `ctx.transport?.onBeforeSend(...)`.
   */
  transport?: PluginTransportContext;
};

/**
 * Returns context that plugins can use to interact with the GraphiQL runtime.
 *
 * Call from inside a plugin's `content` component (which renders within the
 * `<GraphiQLProvider>` tree).
 *
 * `ctx.transport` is `undefined` when the host uses the legacy `fetcher` prop.
 */
export function useGraphiQLPluginContext(): GraphiQLPluginContext {
  const registry = useContext(TransportHookContext);
  if (registry === null) {
    return {};
  }
  return {
    transport: {
      onBeforeSend: registry.onBeforeSend.bind(registry),
      onResponse: registry.onResponse.bind(registry),
      onError: registry.onError.bind(registry),
    },
  };
}
