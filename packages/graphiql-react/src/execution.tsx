import { useStore } from 'zustand/react';

import { useGraphiQLStore } from './hooks';

export const useExecutionContext = () => {
  const store = useGraphiQLStore();
  return useStore(store, state => state.execution);
};
