import { useCallback } from 'react';

export default function useDispatchedCallback<
  A,
  F extends (...args: any[]) => any
>(dispatch: React.Dispatch<A>, callback: F) {
  return useCallback(
    (...payload: Parameters<F>) => dispatch(callback(...payload)),
    [dispatch, callback],
  );
}
