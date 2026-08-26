import type {
  Transport,
  TransportRequest,
  TransportResponse,
} from '@graphiql/toolkit';

/** A function invoked before a request is sent; may transform the request. */
export type OnBeforeSendCallback = (
  req: TransportRequest,
) => TransportRequest | Promise<TransportRequest>;

/**
 * A function invoked after a response is received. Observe-only: a callback
 * that throws is logged to the console and does not affect the stream.
 */
export type OnResponseCallback = (res: TransportResponse) => void;

/**
 * A function invoked when `send()` rejects — a thrown `onBeforeSend` hook, a
 * network failure, or anything else that keeps a `TransportResponse` from ever
 * being produced. `req` is the request as transformed by whichever
 * `onBeforeSend` hooks had run before the failure — the closest thing to what
 * went (or would have gone) on the wire. Observe-only, like `onResponse`: the
 * original error still propagates to the caller, and a callback that itself
 * throws is logged rather than allowed to mask that error.
 */
export type OnErrorCallback = (error: unknown, req: TransportRequest) => void;

/** Cleanup function returned by hook registration. Call it to remove the hook. */
export type CleanupFn = () => void;

const DONE_RESULT: IteratorResult<TransportResponse> = {
  value: undefined as unknown as TransportResponse,
  done: true,
};

/**
 * Observer hooks (`onResponse`, `onError`) must not be able to break the
 * stream they observe: a callback that throws is logged and skipped.
 */
function invokeObservers<Args extends unknown[]>(
  callbacks: ReadonlyArray<(...args: Args) => void>,
  hookName: string,
  ...args: Args
): void {
  for (const cb of callbacks) {
    try {
      cb(...args);
    } catch (callbackError) {
      // eslint-disable-next-line no-console
      console.error(
        `GraphiQL: a transport \`${hookName}\` hook threw:`,
        callbackError,
      );
    }
  }
}

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
   *
   * Disposing the iterator (`return()`) while `onBeforeSend` hooks are still
   * awaited means the underlying `send()` is never invoked; disposing while a
   * request is in flight drops its late result instead of delivering it.
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
            // The request as transformed so far by onBeforeSend hooks — what
            // `onError` reports, since it's the closest thing to what went
            // (or would have gone) on the wire.
            let latestReq = request;
            let done = false;

            return {
              async next(): Promise<IteratorResult<TransportResponse>> {
                if (done) {
                  return DONE_RESULT;
                }

                try {
                  // First call: run onBeforeSend hooks then delegate to transport
                  if (iter === null && singlePromise === null) {
                    // Run all onBeforeSend hooks in order
                    for (const cb of _beforeSend) {
                      latestReq = await cb(latestReq);
                    }

                    // The consumer may have disposed us (`return()`) while an
                    // onBeforeSend hook was awaited — don't start a request
                    // nobody is listening to.
                    if (done) {
                      return DONE_RESULT;
                    }

                    const result = transport.send(latestReq);

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
                    // Disposed while the request was in flight. The fetch
                    // itself is governed by the caller's `signal`; here we
                    // just drop the late value.
                    if (done) {
                      return DONE_RESULT;
                    }
                    invokeObservers(_onResponse, 'onResponse', tr);
                    done = true;
                    return { value: tr, done: false };
                  }

                  // Iterable path
                  const result = await iter!.next();
                  // Disposed while awaiting — `return()` already forwarded to
                  // the underlying iterator, so drop the late value.
                  if (done) {
                    return DONE_RESULT;
                  }
                  if (result.done) {
                    done = true;
                    return DONE_RESULT;
                  }
                  invokeObservers(_onResponse, 'onResponse', result.value);
                  return result;
                } catch (error) {
                  // An error surfacing after the consumer disposed the
                  // iterator (e.g. the aborted fetch of a stopped request)
                  // isn't a failure anyone is listening to — don't report it
                  // to `onError` observers.
                  const wasDisposed = done;
                  done = true;
                  if (!wasDisposed) {
                    invokeObservers(_onError, 'onError', error, latestReq);
                  }
                  throw error;
                }
              },

              return(value?: unknown) {
                done = true;
                return iter?.return?.(value) ?? Promise.resolve(DONE_RESULT);
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
