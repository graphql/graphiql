import { useStore } from 'zustand/react';
import { UserOptions } from '@graphiql/toolkit';
import { useContext } from 'react';
import { GraphiQLStoreContext } from './provider';

// move this to @graphiql/react ofc
export const useGraphiQLStore = (options?: UserOptions) => {
  const store = useContext(GraphiQLStoreContext);
  if (!store) throw new Error('Missing GraphiQLProvider in the tree');
  return store;
};

// TODO: move this to it's own section, where use settings are edited
export const useOptionsContext = (options?: UserOptions) => {
  return useStore(useGraphiQLStore(options), state => state.options);
};
