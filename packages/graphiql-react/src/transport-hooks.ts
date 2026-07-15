import type {
  Transport,
  TransportRequest,
  TransportResponse,
} from '@graphiql/toolkit';

/** A function invoked before a request is sent; may transform the request. */
export type OnBeforeSendCallback = (
  req: TransportRequest,
) => TransportRequest | Promise<TransportRequest>;

/** A function invoked after a response is received. */
export type OnResponseCallback = (res: TransportResponse) => void;

/**
 * A function invoked when `send()` rejects — a thrown `onBeforeSend` hook, a
 * network failure, or anything else that keeps a `TransportResponse` from ever
 * being produced. Observe-only, like `onResponse`; the error still propagates
 * to the caller after every registered callback runs.
 */
export type OnErrorCallback = (error: unknown, req: TransportRequest) => void;

/** Cleanup function returned by hook registration. Call it to remove the hook. */
export type CleanupFn = () => void;

/**
 * Registry of request/response hooks for the transport path.
 * Created once per `<GraphiQLProvider transport={...}>` mount.
 * Absent (i.e. context value is `undefined`) when the host uses a `fetcher`.
 */
export class TransportHookRegistry {
  /** @internal */
  readonly _beforeSend: OnBeforeSendCallback[] = [];
  /** @internal */
  readonly _onResponse: OnResponseCallback[] = [];
  /** @internal */
  readonly _onError: OnErrorCallback[] = [];

  /**
   * Register a callback that runs before each request is sent.
   * The callback may return a (possibly async) transformed `TransportRequest`.
   * Returns a cleanup function that removes the callback.
   */
  onBeforeSend(cb: OnBeforeSendCallback): CleanupFn {
    this._beforeSend.push(cb);
    return () => {
      const idx = this._beforeSend.indexOf(cb);
      if (idx !== -1) {
        this._beforeSend.splice(idx, 1);
      }
    };
  }

  /**
   * Register a callback that runs after each response is received.
   * Returns a cleanup function that removes the callback.
   */
  onResponse(cb: OnResponseCallback): CleanupFn {
    this._onResponse.push(cb);
    return () => {
      const idx = this._onResponse.indexOf(cb);
      if (idx !== -1) {
        this._onResponse.splice(idx, 1);
      }
    };
  }

  /**
   * Register a callback that runs when `send()` rejects instead of resolving
   * to a `TransportResponse` — a thrown `onBeforeSend` hook or a network
   * failure, for example. Returns a cleanup function that removes the callback.
   */
  onError(cb: OnErrorCallback): CleanupFn {
    this._onError.push(cb);
    return () => {
      const idx = this._onError.indexOf(cb);
      if (idx !== -1) {
        this._onError.splice(idx, 1);
      }
    };
  }

  /**
   * Wrap a `Transport` so all `onBeforeSend` and `onResponse` hooks are
   * invoked transparently on each call to `send()`.
   *
   * The wrapped transport always returns an `AsyncIterable<TransportResponse>`.
   * For queries and mutations (where the underlying transport returns a
   * `Promise`), the iterable emits exactly one value then completes.
   * For subscriptions and incremental delivery (where the underlying transport
   * returns an `AsyncIterable`), each chunk is forwarded in turn.
   *
   * Hooks run in registration order: all `onBeforeSend` callbacks complete
   * before the underlying `send()` is called; all `onResponse` callbacks fire
   * after each response value is received.
   */
  wrap(transport: Transport): Transport {
    const { _beforeSend, _onResponse, _onError } = this;

    return {
      ...transport,
      send(request: TransportRequest): AsyncIterable<TransportResponse> {
        return {
          [Symbol.asyncIterator]() {
            let iter: AsyncIterator<TransportResponse> | null = null;
            let singlePromise: Promise<TransportResponse> | null = null;
            let done = false;

            return {
              async next(): Promise<IteratorResult<TransportResponse>> {
                if (done) {
                  return {
                    value: undefined as unknown as TransportResponse,
                    done: true,
                  };
                }

                try {
                  // First call: run onBeforeSend hooks then delegate to transport
                  if (iter === null && singlePromise === null) {
                    // Run all onBeforeSend hooks in order
                    let req = request;
                    for (const cb of _beforeSend) {
                      req = await cb(req);
                    }

                    const result = transport.send(req);

                    if (
                      result !== null &&
                      typeof result === 'object' &&
                      Symbol.asyncIterator in result
                    ) {
                      // Iterable path: subscriptions / incremental delivery
                      iter = (result as AsyncIterable<TransportResponse>)[
                        Symbol.asyncIterator
                      ]();
                    } else {
                      // Promise path: queries / mutations
                      singlePromise = result as Promise<TransportResponse>;
                    }
                  }

                  if (singlePromise !== null) {
                    const tr = await singlePromise;
                    for (const cb of _onResponse) {
                      cb(tr);
                    }
                    done = true;
                    return { value: tr, done: false };
                  }

                  // Iterable path
                  const result = await iter!.next();
                  if (result.done) {
                    done = true;
                    return {
                      value: undefined as unknown as TransportResponse,
                      done: true,
                    };
                  }
                  for (const cb of _onResponse) {
                    cb(result.value);
                  }
                  return result;
                } catch (error) {
                  done = true;
                  for (const cb of _onError) {
                    cb(error, request);
                  }
                  throw error;
                }
              },

              return(value?: unknown) {
                done = true;
                return (
                  iter?.return?.(value) ??
                  Promise.resolve({
                    value: undefined as unknown as TransportResponse,
                    done: true as const,
                  })
                );
              },

              throw(error?: unknown) {
                done = true;
                return iter?.throw?.(error) ?? Promise.reject(error);
              },
            };
          },
        };
      },
    };
  }
}
