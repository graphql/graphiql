import { FC, ReactElement, ReactNode, useEffect } from 'react';
import { storageStore } from './index';
import { createStore } from 'zustand';
import { createBoundedUseStore } from '../utility';

/**
 * The value `null` semantically means that the user does not explicitly choose
 * any theme, so we use the system default.
 */
type Theme = 'light' | 'dark' | null;

type ThemeStoreType = {
  theme: Theme;
  /**
   * Set a new theme
   */
  setTheme: (newTheme: Theme) => void;
};

type ThemeStoreProps = {
  children: ReactNode;
  /**
   * @default null
   */
  defaultTheme: Theme;
};

export const themeStore = createStore<ThemeStoreType>(set => ({
  theme: null,
  setTheme(theme) {
    document.body.classList.remove('graphiql-light', 'graphiql-dark');
    if (theme) {
      document.body.classList.add(`graphiql-${theme}`);
    }

    const { storage } = storageStore.getState();
    storage.set(STORAGE_KEY, theme ?? '');
    set({ theme });
  },
}));

export const ThemeStore: FC<ThemeStoreProps> = ({
  children,
  defaultTheme = null,
}) => {
  useEffect(() => {
    const { storage } = storageStore.getState();

    function getInitialTheme() {
      const stored = storage.get(STORAGE_KEY);
      switch (stored) {
        case 'light':
          return 'light';
        case 'dark':
          return 'dark';
        default:
          if (typeof stored === 'string') {
            // Remove the invalid stored value
            storage.set(STORAGE_KEY, '');
          }
          return defaultTheme;
      }
    }

    themeStore.setState({ theme: getInitialTheme() });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return children as ReactElement;
};

const STORAGE_KEY = 'theme';

export const useThemeStore = createBoundedUseStore(themeStore);
