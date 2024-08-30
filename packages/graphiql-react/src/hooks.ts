import { useStore } from 'zustand';
import { useContext } from 'react';
import { GraphiQLStoreContext } from './provider';

// move this to @graphiql/react ofc
export const useGraphiQLStore = () => {
  const store = useContext(GraphiQLStoreContext);
  if (!store) throw new Error('Missing GraphiQLProvider in the tree');
  return store;
};

// TODO: move this to it's own section, where use settings are edited
export const useOptionsContext = () => {
  return useStore(useGraphiQLStore(), state => state.options);
};
