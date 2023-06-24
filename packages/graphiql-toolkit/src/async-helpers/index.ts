import {
  FetcherResult,
  FetcherReturnType,
  Observable,
} from '../create-fetcher';

// Duck-type promise detection.
export function isPromise<T>(value: Promise<T> | any): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  );
}

// Duck-type Observable.take(1).toPromise()
function observableToPromise<T>(observable: Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const subscription = observable.subscribe({
      next(v) {
        resolve(v);
        subscription.unsubscribe();
      },
      error: reject,
      complete() {
        reject(new Error('no value resolved'));
      },
    });
  });
}

// Duck-type observable detection.
export function isObservable<T>(value: any): value is Observable<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'subscribe' in value &&
    typeof value.subscribe === 'function'
  );
}

export function isAsyncIterable(
  input: unknown,
): input is AsyncIterable<unknown> {
  return (
    typeof input === 'object' &&
    input !== null &&
    // Some browsers still don't have Symbol.asyncIterator implemented (iOS Safari)
    // That means every custom AsyncIterable must be built using a AsyncGeneratorFunction (async function * () {})
    ((input as any)[Symbol.toStringTag] === 'AsyncGenerator' ||
      Symbol.asyncIterator in input)
  );
}

async function asyncIterableToPromise<T>(
  input: AsyncIterable<T> | AsyncIterableIterator<T>,
): Promise<T> {
  // Also support AsyncGenerator on Safari iOS.
  // As mentioned in the isAsyncIterable function, there is no Symbol.asyncIterator available,
  // so every AsyncIterable must be implemented using AsyncGenerator.
  const iteratorReturn = (
    'return' in input ? input : input[Symbol.asyncIterator]()
  ).return?.bind(input);
  const iteratorNext = (
    'next' in input ? input : input[Symbol.asyncIterator]()
  ).next.bind(input);

  const result = await iteratorNext();
  // ensure cleanup
  void iteratorReturn?.();
  return result.value;
}

export async function fetcherReturnToPromise(
  fetcherResult: FetcherReturnType,
): Promise<FetcherResult> {
  const result = await fetcherResult;
  if (isAsyncIterable(result)) {
    return asyncIterableToPromise(result);
  }
  if (isObservable(result)) {
    return observableToPromise(result);
  }
  return result;
}
