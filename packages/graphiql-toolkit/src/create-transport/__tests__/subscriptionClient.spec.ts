import { describe, it, expect, vi } from 'vitest';
import 'isomorphic-fetch';

import { createTransport } from '../createTransport';
import type {
  SubscriptionClient,
  SubscriptionSink,
  TransportResponse,
} from '../types';
import type { Client } from 'graphql-ws';
import type { ExecutionResult } from 'graphql';

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
    const dispose = vi.fn();
    const client: SubscriptionClient = {
      subscribe(_request, sink) {
        let active = true;
        void (async () => {
          for (const value of [1, 2]) {
            await tick();
            if (!active) {
              return;
            }
            sink.next({ data: { tick: value } });
          }
          await tick();
          if (active) {
            sink.complete();
          }
        })();
        return () => {
          active = false;
          dispose();
        };
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

  it('passes the GraphQL request through to `subscribe`', async () => {
    const seen: unknown[] = [];
    const client: SubscriptionClient = {
      subscribe(request, sink) {
        seen.push(request);
        void (async () => {
          await tick();
          sink.complete();
        })();
        return () => {};
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
      subscribe(_request, sink: SubscriptionSink) {
        void (async () => {
          await tick();
          sink.next({
            errors: [{ message: 'boom' }],
          } as unknown as ExecutionResult);
          await tick();
          sink.complete();
        })();
        return () => {};
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

  it('disposes the subscription when the consumer stops iterating early', async () => {
    const dispose = vi.fn();
    const client: SubscriptionClient = {
      subscribe(_request, sink) {
        let active = true;
        void (async () => {
          await tick();
          if (active) {
            sink.next({ data: { tick: 1 } });
          }
          // Never completes; stays open until disposed.
        })();
        return () => {
          active = false;
          dispose();
        };
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
