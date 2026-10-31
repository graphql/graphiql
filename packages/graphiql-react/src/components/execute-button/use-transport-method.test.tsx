'use no memo';

import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createTransport,
  type HttpMethod,
  type Transport,
  type TransportResponse,
} from '@graphiql/toolkit';
import { GraphiQLProvider, useGraphiQL } from '../provider';
import { useTransportMethod } from './use-transport-method';

vi.mock('../../stores/monaco', () => {
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
afterEach(() => vi.unstubAllGlobals());

function useProviderMethod() {
  return useTransportMethod(useGraphiQL(state => state.transport));
}

function wrapper(transport: Transport) {
  return ({ children }: { children: ReactNode }) => (
    <GraphiQLProvider transport={transport} schema={null}>
      {children}
    </GraphiQLProvider>
  );
}

it('reflects an initial override and external changes through the provider wrapper', () => {
  const transport = createTransport({
    url: '/graphql',
    supportedMethods: ['GET', 'POST', 'QUERY'],
    method: 'GET',
  });
  const { result } = renderHook(useProviderMethod, {
    wrapper: wrapper(transport),
  });
  expect(result.current).toMatchObject({
    queryMethod: 'GET',
    methodOverride: 'GET',
    isMethodAutomatic: false,
  });
  act(() => transport.setMethod?.());
  expect(result.current).toMatchObject({
    queryMethod: 'QUERY',
    methodOverride: undefined,
    isMethodAutomatic: true,
  });
  act(() => transport.setMethod?.('QUERY'));
  expect(result.current).toMatchObject({
    queryMethod: 'QUERY',
    methodOverride: 'QUERY',
    isMethodAutomatic: false,
  });
});

it('updates capabilities after discovery, including discovery with different headers', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(async (_url, init) =>
      init?.method === 'OPTIONS'
        ? new Response(null, {
            status: 204,
            headers: {
              Allow: new Headers(init.headers).has('authorization')
                ? 'POST, GET'
                : 'POST, QUERY',
            },
          })
        : Response.json({ data: {} }),
    );
  const transport = createTransport({
    url: '/graphql',
    fetch,
    enableIncrementalDelivery: false,
  });
  const { result } = renderHook(
    () => ({
      method: useProviderMethod(),
      transport: useGraphiQL(state => state.transport)!,
    }),
    { wrapper: wrapper(transport) },
  );
  expect(result.current.method.queryMethod).toBe('POST');
  await act(async () => {
    for await (const _response of result.current.transport.send({
      query: '{ field }',
    }) as AsyncIterable<TransportResponse>) {
      /* consume */
    }
  });
  expect(result.current.method).toMatchObject({
    queryMethod: 'QUERY',
    supportedMethods: ['POST', 'QUERY'],
    isMethodAutomatic: true,
  });
  await act(async () => {
    for await (const _response of result.current.transport.send({
      query: '{ field }',
      headers: { authorization: 'Bearer example' },
    }) as AsyncIterable<TransportResponse>) {
      /* consume */
    }
  });
  expect(result.current.method).toMatchObject({
    queryMethod: 'POST',
    supportedMethods: ['GET', 'POST'],
    isMethodAutomatic: true,
  });
});

it('changes query preference without sending an operation', () => {
  const transport = createTransport({
    url: '/graphql',
    supportedMethods: ['POST', 'GET'],
  });
  const send = vi.spyOn(transport, 'send');
  const { result } = renderHook(useProviderMethod, {
    wrapper: wrapper(transport),
  });
  act(() => result.current.onSetMethod?.('GET'));
  expect(result.current).toMatchObject({
    queryMethod: 'GET',
    isMethodAutomatic: false,
    methodOverride: 'GET',
  });
  act(() => result.current.onSetMethod?.());
  expect(result.current).toMatchObject({
    queryMethod: 'POST',
    isMethodAutomatic: true,
  });
  expect(send).not.toHaveBeenCalled();
});

it('replaces subscriptions when the provider changes transport or switches to a fetcher', () => {
  const first = createTransport({
    url: '/first',
    supportedMethods: ['GET', 'POST'],
  });
  const second = createTransport({
    url: '/second',
    supportedMethods: ['QUERY'],
  });
  let transport: Transport | undefined = first;
  const { result, rerender } = renderHook(useProviderMethod, {
    wrapper: ({ children }) => (
      <GraphiQLProvider
        {...(transport
          ? { transport }
          : { fetcher: async () => ({ data: {} }) })}
        schema={null}
      >
        {children}
      </GraphiQLProvider>
    ),
  });
  act(() => result.current.onSetMethod?.('GET'));
  transport = second;
  rerender();
  expect(result.current).toMatchObject({
    queryMethod: 'QUERY',
    isMethodAutomatic: true,
  });
  act(() => first.setMethod?.('POST'));
  expect(result.current.queryMethod).toBe('QUERY');
  transport = undefined;
  rerender();
  expect(result.current.queryMethod).toBeUndefined();
  expect(result.current.onSetMethod).toBeUndefined();
});

it('supports custom setters without subscriptions or an observable override', () => {
  const transport: Transport = {
    url: '/custom',
    method: 'POST',
    get supportedMethods(): HttpMethod[] {
      return ['POST', 'GET'];
    },
    setMethod(method) {
      this.method = method ?? 'POST';
    },
    send: async () => ({
      ok: true,
      body: {},
      timing: { totalMs: 0 },
      size: {},
    }),
  };
  const { result } = renderHook(useProviderMethod, {
    wrapper: wrapper(transport),
  });
  expect(result.current.isMethodAutomatic).toBe(false);
  act(() => result.current.onSetMethod?.('GET'));
  expect(result.current).toMatchObject({
    queryMethod: 'GET',
    methodOverride: 'GET',
    isMethodAutomatic: false,
  });
  act(() => result.current.onSetMethod?.());
  expect(result.current).toMatchObject({
    queryMethod: 'POST',
    isMethodAutomatic: true,
  });
});

it('leaves a custom read-only transport read-only', () => {
  const transport: Transport = {
    url: '/custom',
    method: 'GET',
    supportedMethods: ['GET'],
    send: async () => ({
      ok: true,
      body: {},
      timing: { totalMs: 0 },
      size: {},
    }),
  };
  const { result } = renderHook(useProviderMethod, {
    wrapper: wrapper(transport),
  });
  expect(result.current).toMatchObject({
    queryMethod: 'GET',
    isMethodAutomatic: false,
    onSetMethod: undefined,
  });
});
