'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  TransportHookContext,
  useGraphiQLPluginContext,
} from './transport-hooks.context';
import { TransportHookRegistry } from './transport-hooks';

function wrapWith(registry: TransportHookRegistry | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TransportHookContext.Provider value={registry}>
        {children}
      </TransportHookContext.Provider>
    );
  };
}

describe('useGraphiQLPluginContext', () => {
  it('returns empty context when no registry is present (fetcher path)', () => {
    const { result } = renderHook(() => useGraphiQLPluginContext(), {
      wrapper: wrapWith(null),
    });
    expect(result.current.transport).toBeUndefined();
  });

  it('returns transport hooks when a registry is present (transport path)', () => {
    const registry = new TransportHookRegistry();
    const { result } = renderHook(() => useGraphiQLPluginContext(), {
      wrapper: wrapWith(registry),
    });
    expect(result.current.transport).toBeDefined();
    expect(typeof result.current.transport?.onBeforeSend).toBe('function');
    expect(typeof result.current.transport?.onResponse).toBe('function');
  });

  it('onBeforeSend from plugin context wires into the registry', async () => {
    const registry = new TransportHookRegistry();
    const cb = vi.fn((req: any) => req);

    const { result } = renderHook(() => useGraphiQLPluginContext(), {
      wrapper: wrapWith(registry),
    });

    result.current.transport!.onBeforeSend(cb);

    // Drive the registry directly to verify the callback is registered
    const transport = registry.wrap({
      send: async () => ({
        ok: true,
        body: {},
        timing: { totalMs: 0 },
        size: {},
      }),
    });
    const iter = transport.send({ query: '{ test }' }) as AsyncIterable<any>;
    for await (const _ of iter) {
      /* consume */
    }

    expect(cb).toHaveBeenCalledOnce();
  });

  it('onBeforeSend cleanup from plugin context removes the hook', async () => {
    const registry = new TransportHookRegistry();
    const cb = vi.fn((req: any) => req);

    const { result } = renderHook(() => useGraphiQLPluginContext(), {
      wrapper: wrapWith(registry),
    });

    const cleanup = result.current.transport!.onBeforeSend(cb);
    cleanup();

    const transport = registry.wrap({
      send: async () => ({
        ok: true,
        body: {},
        timing: { totalMs: 0 },
        size: {},
      }),
    });
    const iter = transport.send({ query: '{ test }' }) as AsyncIterable<any>;
    for await (const _ of iter) {
      /* consume */
    }

    expect(cb).not.toHaveBeenCalled();
  });
});
