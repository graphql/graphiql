import type {
  ClientOptions,
  createClient as createClientType,
  ExecutionResult,
} from 'graphql-sse';
import { Fetcher, FetcherParams } from './types';

export async function createSseFetcher(opts: ClientOptions): Promise<Fetcher> {
  const { createClient } =
    process.env.USE_IMPORT === 'false'
      ? (require('graphql-sse') as { createClient: typeof createClientType })
      : await import('graphql-sse');

  const sseClient = createClient({
    retryAttempts: 0,
    // @ts-expect-error
    singleConnection: true, // or use false if you have an HTTP/2 server
    // @ts-expect-error
    lazy: false, // connect as soon as the page opens
    ...opts,
  });

  function subscribe(payload: FetcherParams) {
    let deferred: {
      resolve: (arg: boolean) => void;
      reject: (arg: unknown) => void;
    };

    const pending: ExecutionResult<Record<string, unknown>, unknown>[] = [];
    let throwMe: unknown;
    let done = false;

    const dispose = sseClient.subscribe(
      {
        ...payload,
        // types are different with FetcherParams
        operationName: payload.operationName ?? undefined,
      },
      {
        next(data) {
          pending.push(data);
          deferred?.resolve(false);
        },
        error(err) {
          throwMe = err;
          deferred?.reject(throwMe);
        },
        complete() {
          done = true;
          deferred?.resolve(true);
        },
      },
    );

    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      async next() {
        if (done) {
          return { done: true, value: undefined };
        }
        if (throwMe) {
          throw throwMe;
        }
        if (pending.length) {
          return { value: pending.shift() };
        }
        return (await new Promise((resolve, reject) => {
          deferred = { resolve, reject };
        }))
          ? { done: true, value: undefined }
          : { value: pending.shift() };
      },
      async return() {
        dispose();
        return { done: true, value: undefined };
      },
    };
  }

  // @ts-expect-error todo: fix type
  return subscribe;
}
