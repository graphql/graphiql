import { describe, it, expect, vi } from 'vitest';
import 'isomorphic-fetch';

import { createTransport } from '../createTransport';
import type { SubscriptionClient, TransportResponse } from '../types';
import type { Client } from 'graphql-ws';
import type { ExecutionResult, FormattedExecutionResult } from 'graphql';

const URL = 'http://localhost:3000/graphql';
const SUBSCRIPTION = 'subscription OnTick { tick }';

// A real subscription client delivers each frame in its own event-loop turn, so
// the consumer drains one before the next (and before `complete`) arrives. This
// mirrors that, rather than emitting synchronously.
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

async function collect(
  iterable: AsyncIterable<TransportResponse>,
): Promise<TransportResponse[]> {
  const out: TransportResponse[] = [];
  for await (const event of iterable) {
    out.push(event);
  }
  return out;
}

describe('createTransport — custom SubscriptionClient', () => {
  it('a graphql-ws `Client` is assignable to `SubscriptionClient` without a cast', () => {
    // Compile-time guarantee: the contract stays a structural subset of the
    // real `graphql-ws` client, so `createClient({ url })` drops in directly.
    // If the contract drifts, this stops compiling.
    const asContract = (client: SubscriptionClient): SubscriptionClient =>
      client;
    const wsClient = undefined as unknown as Client;
    expect(asContract(wsClient)).toBe(wsClient);
  });

  it('drives subscriptions end-to-end through the real adapter (no graphql-ws)', async () => {
    const client: SubscriptionClient = {
      async *iterate() {
        for (const value of [1, 2]) {
          await tick();
          yield { data: { tick: value } };
        }
      },
    };

    const transport = createTransport({ url: URL, subscriptionClient: client });
    const events = await collect(
      transport.send({
        query: SUBSCRIPTION,
      }) as AsyncIterable<TransportResponse>,
    );

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ ok: true, body: { data: { tick: 1 } } });
    expect(events[1]).toMatchObject({ ok: true, body: { data: { tick: 2 } } });
    // A socket-less client has no HTTP envelope to surface.
    expect(events[0].status).toBeUndefined();
    expect(events[0].headers).toBeUndefined();
    expect(events[0].size.response).toBeGreaterThan(0);
  });

  it('passes the GraphQL request through to `iterate`', async () => {
    const seen: unknown[] = [];
    const client: SubscriptionClient = {
      async *iterate(request) {
        seen.push(request);
        yield { data: null };
      },
    };

    const transport = createTransport({ url: URL, subscriptionClient: client });
    await collect(
      transport.send({
        query: SUBSCRIPTION,
        operationName: 'OnTick',
        variables: { id: '1' },
      }) as AsyncIterable<TransportResponse>,
    );

    expect(seen[0]).toMatchObject({
      query: SUBSCRIPTION,
      operationName: 'OnTick',
      variables: { id: '1' },
    });
  });

  it('marks an event carrying `errors` as not ok', async () => {
    const client: SubscriptionClient = {
      async *iterate() {
        await tick();
        yield {
          errors: [{ message: 'boom' }],
        } as unknown as ExecutionResult;
      },
    };

    const transport = createTransport({ url: URL, subscriptionClient: client });
    const [event] = await collect(
      transport.send({
        query: SUBSCRIPTION,
      }) as AsyncIterable<TransportResponse>,
    );

    expect(event.ok).toBe(false);
    expect(event.body).toMatchObject({ errors: [{ message: 'boom' }] });
  });

  it('disposes while the next event is pending and settles pending iteration', async () => {
    const dispose = vi.fn();
    let settleNext!: (result: IteratorResult<FormattedExecutionResult>) => void;
    const source: AsyncIterableIterator<FormattedExecutionResult> = {
      next: () => new Promise(resolve => (settleNext = resolve)),
      async return() {
        dispose();
        settleNext({ done: true, value: undefined });
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
    const transport = createTransport({
      url: URL,
      subscriptionClient: {
        iterate() {
          return source;
        },
      },
    });
    const iterator = (
      transport.send({
        query: SUBSCRIPTION,
      }) as AsyncIterable<TransportResponse>
    )[Symbol.asyncIterator]();
    const first = iterator.next();
    settleNext({ done: false, value: { data: { tick: 1 } } });
    expect((await first).value.body).toMatchObject({ data: { tick: 1 } });

    const pending = iterator.next();
    const stopped = iterator.return!();
    await tick();
    expect(dispose).toHaveBeenCalledTimes(1);
    await expect(stopped).resolves.toMatchObject({ done: true });
    await expect(pending).resolves.toMatchObject({ done: true });
    await iterator.return!();
    expect(dispose).toHaveBeenCalledTimes(1);
    await expect(iterator.next()).resolves.toMatchObject({ done: true });
  });

  it('disposes the subscription when the consumer stops iterating early', async () => {
    const dispose = vi.fn();
    const client: SubscriptionClient = {
      iterate() {
        return (async function* () {
          try {
            await tick();
            yield { data: { tick: 1 } };
            await new Promise(() => {});
          } finally {
            dispose();
          }
        })();
      },
    };

    const transport = createTransport({ url: URL, subscriptionClient: client });
    const iterable = transport.send({
      query: SUBSCRIPTION,
    }) as AsyncIterable<TransportResponse>;

    for await (const event of iterable) {
      expect(event.body).toMatchObject({ data: { tick: 1 } });
      break; // early exit → dispose must run
    }

    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
