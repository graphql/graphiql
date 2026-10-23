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

it('replaces the wrapped transport and can switch back to a fetcher', () => {
  const first = createTransport({ url: '/first', supportedMethods: ['POST'] });
  const second = createTransport({ url: '/second', supportedMethods: ['GET'] });
  let transport: Transport | undefined = first;
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

  expect(result.current.transport?.url).toBe('/first');
  transport = second;
  rerender();
  expect(result.current.transport?.url).toBe('/second');
  expect(result.current.transport?.method).toBe('GET');

  transport = undefined;
  rerender();
  expect(result.current.transport).toBeUndefined();
  expect(result.current.fetcher).toBe(fetcher);
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
    'QUERY',
  ]);
  expect(beforeSend).toHaveBeenCalledOnce();
  expect(onResponse).toHaveBeenCalledOnce();
  expect(onResponse.mock.calls[0]?.[0]).toMatchObject({ method: 'QUERY' });
  expect(result.current.state.transport!.supportedMethods).toEqual([
    'POST',
    'QUERY',
  ]);
});
