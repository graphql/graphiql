import { useState, useSyncExternalStore } from 'react';
import type { HttpMethod, Transport } from '@graphiql/toolkit';

export function useTransportMethod(transport?: Transport) {
  const [selection, setSelection] = useState<{
    transport: Transport;
    method: HttpMethod | undefined;
  }>();
  const subscribe = (listener: () => void) =>
    transport?.subscribe?.(listener) ?? (() => {});
  // A primitive snapshot stays stable even if a custom transport returns a new
  // supportedMethods array from its getter on every read.
  const getSnapshot = () =>
    JSON.stringify(
      transport
        ? [
            transport.method,
            transport.methodOverride,
            transport.supportedMethods,
          ]
        : null,
    );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const methods = JSON.parse(snapshot) as
    | [HttpMethod, HttpMethod | null, HttpMethod[]]
    | null;
  const observesOverride = transport && 'methodOverride' in transport;
  const selectedHere = transport && selection?.transport === transport;
  const methodOverride = observesOverride
    ? (methods?.[1] ?? undefined)
    : selectedHere
      ? selection.method
      : undefined;

  return {
    queryMethod: methods?.[0],
    supportedMethods: methods?.[2] ?? [],
    methodOverride,
    isMethodAutomatic: Boolean(
      (observesOverride || selectedHere) && methodOverride === undefined,
    ),
    onSetMethod: transport?.setMethod
      ? (method?: HttpMethod) => {
          transport.setMethod!(method);
          // Older custom transports can support selection without subscribing.
          setSelection({ transport, method });
        }
      : undefined,
  };
}
