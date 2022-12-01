import create from 'zustand';

// constants
import { INITIAL_NAV_STACK_ITEM } from './constants';

// types
import { DocExplorerStore, ExplorerNavStack } from './types';

export const useDocExplorer = create<DocExplorerStore>((set, get) => ({
  explorerNavStack: [INITIAL_NAV_STACK_ITEM],
  push: item => {
    const currentNavStack = get().explorerNavStack;
    const lastItem = currentNavStack[currentNavStack.length - 1];
    set({
      explorerNavStack:
        lastItem.def === item.def
          ? // Avoid pushing duplicate items
            currentNavStack
          : [...currentNavStack, item],
    });
  },
  pop: () => {
    const currentNavStack = get().explorerNavStack;

    set({
      explorerNavStack:
        currentNavStack.length > 1
          ? (currentNavStack.slice(0, -1) as ExplorerNavStack)
          : currentNavStack,
    });
  },
  reset: () => {
    const currentNavStack = get().explorerNavStack;

    set({
      explorerNavStack:
        currentNavStack.length === 1
          ? currentNavStack
          : [INITIAL_NAV_STACK_ITEM],
    });
  },
}));
