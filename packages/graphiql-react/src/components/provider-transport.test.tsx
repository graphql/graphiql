'use no memo';

import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createTransport,
  type Transport,
  type TransportResponse,
} from '@graphiql/toolkit';
import { GraphiQLProvider, useGraphiQL } from './provider';
import { useGraphiQLPluginContext } from '../transport-hooks.context';

vi.mock('../stores/monaco', () => {
  const state = { actions: { async initialize() {} } };
  return {
    monacoStore: { getState: () => state, subscribe: () => () => {} },
    useMonaco: (selector?: (value: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function observableTransport() {
  const listeners = new Set<() => void>();
  const transport: Transport = {
    url: '/graphql',
    method: 'POST',
    supportedMethods: ['POST'],
    send: async () => ({
      ok: true,
      body: {},
      timing: { totalMs: 0 },
      size: {},
    }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setMethod(method) {
      this.method = method;
      for (const listener of listeners) {
        listener();
      }
    },
  };
  return { transport, listeners };
}

it('synchronizes available methods even when the selected method does not change', () => {
  const { transport, listeners } = observableTransport();
  const { result, unmount } = renderHook(() => useGraphiQL(state => state), {
    wrapper: ({ children }) => (
      <GraphiQLProvider transport={transport} schema={null}>
        {children}
      </GraphiQLProvider>
    ),
  });

  act(() => {
    transport.supportedMethods = ['POST', 'QUERY'];
    for (const listener of listeners) {
      listener();
    }
  });
  expect(result.current.transportMethod).toBe('POST');
  expect(result.current.transportSupportedMethods).toEqual(['POST', 'QUERY']);

  act(() => result.current.actions.setTransportMethod('QUERY'));
  expect(transport.method).toBe('QUERY');
  expect(result.current.transportMethod).toBe('QUERY');
  expect(result.current.transport!.method).toBe('QUERY');

  act(() => transport.setMethod!('POST'));
  expect(result.current.transportMethod).toBe('POST');
  unmount();
  expect(listeners.size).toBe(0);
});

it('releases subscriptions when replacing a transport or switching to a fetcher', () => {
  const first = observableTransport();
  const second = observableTransport();
  second.transport.method = 'GET';
  second.transport.supportedMethods = ['GET'];
  let transport: Transport | undefined = first.transport;
  const fetcher = async () => ({ data: {} });
  const { result, rerender } = renderHook(() => useGraphiQL(state => state), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <GraphiQLProvider
        {...(transport ? { transport } : { fetcher })}
        schema={null}
      >
        {children}
      </GraphiQLProvider>
    ),
  });

  transport = second.transport;
  rerender();
  expect(first.listeners.size).toBe(0);
  expect(second.listeners.size).toBe(1);
  expect(result.current.transportMethod).toBe('GET');
  expect(result.current.transportSupportedMethods).toEqual(['GET']);

  transport = undefined;
  rerender();
  expect(second.listeners.size).toBe(0);
  expect(result.current.transportMethod).toBeNull();
  expect(result.current.transportSupportedMethods).toBeNull();
});

it('discovers through the wrapped transport using headers produced by request hooks', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(async (_url, init) => {
      expect(new Headers(init?.headers).get('authorization')).toBe(
        'Bearer plugin',
      );
      return init?.method === 'OPTIONS'
        ? new Response(null, { status: 204, headers: { Allow: 'POST, QUERY' } })
        : Response.json({ data: { hello: 'world' } });
    });
  const transport = createTransport({
    url: '/graphql',
    fetch,
    enableIncrementalDelivery: false,
  });
  const { result } = renderHook(
    () => ({
      state: useGraphiQL(state => state),
      hooks: useGraphiQLPluginContext().transport!,
    }),
    {
      wrapper: ({ children }) => (
        <GraphiQLProvider transport={transport} schema={null}>
          {children}
        </GraphiQLProvider>
      ),
    },
  );
  const onResponse = vi.fn();
  const beforeSend = vi.fn((request: Parameters<Transport['send']>[0]) => ({
    ...request,
    headers: { authorization: 'Bearer plugin' },
  }));
  result.current.hooks.onBeforeSend(beforeSend);
  result.current.hooks.onResponse(onResponse);

  await act(async () => {
    const responses = result.current.state.transport!.send({
      query: '{ hello }',
    }) as AsyncIterable<TransportResponse>;
    for await (const _response of responses) {
      // Consume the operation through the same wrapper used by execution.
    }
  });

  expect(fetch.mock.calls.map(([, init]) => init?.method)).toEqual([
    'OPTIONS',
    'POST',
  ]);
  expect(beforeSend).toHaveBeenCalledOnce();
  expect(onResponse).toHaveBeenCalledOnce();
  expect(result.current.state.transportSupportedMethods).toEqual([
    'POST',
    'QUERY',
  ]);
  expect(result.current.state.transport!.supportedMethods).toEqual([
    'POST',
    'QUERY',
  ]);
});
