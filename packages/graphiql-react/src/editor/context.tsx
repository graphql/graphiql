import { useStore } from 'zustand/react';

import { useGraphiQLStore } from '../hooks';

export const useEditorContext = () => {
  const store = useGraphiQLStore();
  return useStore(store, state => state.editor);
};
