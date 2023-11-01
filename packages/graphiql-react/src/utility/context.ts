import { Context, createContext, useContext } from 'react';

export function createNullableContext<T>(name: string): Context<T | null> {
  const context = createContext<T | null>(null);
  context.displayName = name;
  return context;
}

export function createContextHook<T>(context: Context<T | null>) {
  function useGivenContext(options: { nonNull: true; caller?: Function }): T;
  function useGivenContext(options: {
    nonNull?: boolean;
    caller?: Function;
  }): T | null;
  function useGivenContext(): T | null;
  function useGivenContext(options?: {
    nonNull?: boolean;
    caller?: Function;
  }): T | null {
    const value = useContext(context);
    if (value === null && options?.nonNull) {
      throw new Error(
        `Tried to use \`${
          options.caller?.name || useGivenContext.caller.name
        }\` without the necessary context. Make sure to render the \`${
          context.displayName
        }Provider\` component higher up the tree.`,
      );
    }
    return value;
  }
  Object.defineProperty(useGivenContext, 'name', {
    value: `use${context.displayName}`,
  });
  return useGivenContext;
}
