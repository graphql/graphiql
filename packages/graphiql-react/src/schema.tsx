import { useStore } from 'zustand';

import { useGraphiQLStore } from './hooks';

export const useSchemaContext = (options?: {
  nonNull?: boolean;
  caller?: Function;
}) => {
  const store = useGraphiQLStore();
  return useStore(store, state => state.schema);
};
