import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useStorageContext } from './storage';
import { createContextHook, createNullableContext } from './utility/context';

/**
 * The value `null` semantically means that the user does not explicitly choose
 * any theme, so we use the system default.
 */
export type Theme = 'light' | 'dark' | null;

export const ThemeContext =
  createNullableContext<ReturnType<typeof useThemeInternal>>('ThemeContext');

function useThemeInternal() {
  const storageContext = useStorageContext();

  const [theme, setThemeInternal] = useState<Theme>(() => {
    if (!storageContext) {
      return null;
    }

    const stored = storageContext.get(STORAGE_KEY);
    switch (stored) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      default:
        if (typeof stored === 'string') {
          // Remove the invalid stored value
          storageContext.set(STORAGE_KEY, '');
        }
        return null;
    }
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    document.body.classList.remove(`graphiql-light`);
    document.body.classList.remove(`graphiql-dark`);
    if (theme) {
      document.body.classList.add(`graphiql-${theme}`);
    }
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      storageContext?.set(STORAGE_KEY, newTheme || '');
      setThemeInternal(newTheme);
    },
    [storageContext],
  );

  return useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
}

type ThemeContextProviderProps = { children: ReactNode };

export function ThemeContextProvider(props: ThemeContextProviderProps) {
  const theme = useThemeInternal();
  return (
    <ThemeContext.Provider value={theme}>
      {props.children}
    </ThemeContext.Provider>
  );
}

/**
 * React hook that exposes the GraphiQL theme selector:
 * usage [theme, setTheme] = useTheme()
 *
 * Theme value can be: `light`, `dark` or `null` if it's system default
 */
export const useTheme = createContextHook(ThemeContext);

const STORAGE_KEY = 'theme';
