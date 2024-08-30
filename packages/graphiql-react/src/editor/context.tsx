import { useStore } from 'zustand';

import { useGraphiQLStore } from '../hooks';

export const useEditorContext = (_options?: {
  nonNull?: boolean;
  caller?: Function;
}) => {
  const store = useGraphiQLStore();
  return useStore(store, state => state.editor);
};
