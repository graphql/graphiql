import { del, get, set, createStore } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

export const createStorage = (appName: string): StateStorage => {
  const customStore = createStore(appName, 'data');
  return {
    getItem: async (name: string): Promise<string | null> => {
      return (await get(name, customStore)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
      await set(name, value, customStore);
    },
    removeItem: async (name: string): Promise<void> => {
      await del(name, customStore);
    },
  };
};
