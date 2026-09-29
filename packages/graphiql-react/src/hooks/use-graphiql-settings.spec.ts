import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MONACO_THEME_NAME } from '../constants';
import { createStore, type StoreApi } from 'zustand';
import { createThemeSlice, type ThemeProps } from '../stores/theme';
import type { SlicesWithActions } from '../types';

// The settings hook drives the Monaco theme through `monacoStore`; stub it
// out so tests can control the mock editor instance the hook sees.
let mockMonaco: { editor: { setTheme: ReturnType<typeof vi.fn> } } | undefined;

vi.mock('../stores/monaco', () => ({
  monacoStore: {
    getState: () => ({ monaco: mockMonaco }),
    subscribe: () => () => {},
  },
  useMonaco: (selector: (state: { monaco: typeof mockMonaco }) => unknown) =>
    selector({ monaco: mockMonaco }),
}));

let mockThemeStore: StoreApi<SlicesWithActions>;

vi.mock('../components/provider', () => ({
  useEditorTheme: () =>
    (mockThemeStore.getState() as { editorTheme?: ThemeProps['editorTheme'] })
      .editorTheme,
}));

function setEditorTheme(editorTheme?: ThemeProps['editorTheme']) {
  mockThemeStore = createStore<SlicesWithActions>(
    (...args) =>
      ({
        ...createThemeSlice({ editorTheme })(...args),
      }) as SlicesWithActions,
  );
}

import {
  useGraphiQLSettings,
  SETTINGS_STORAGE_KEY,
  type GraphiQLSettings,
} from './use-graphiql-settings';

const STORAGE_KEY = SETTINGS_STORAGE_KEY;

function setStorage(value: Partial<GraphiQLSettings>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// jsdom doesn't implement matchMedia; install a configurable stub.
let matchMediaMatches = false;
const systemThemeListeners = new Set<() => void>();

function changeSystemTheme(dark: boolean) {
  act(() => {
    matchMediaMatches = dark;
    for (const listener of systemThemeListeners) {
      listener();
    }
  });
}

beforeAll(() => {
  // Node 24 + jsdom: window exists but localStorage is not populated. Install
  // an in-memory Storage polyfill so the hook (and these tests) have somewhere
  // to read and write.
  if (globalThis.localStorage === undefined) {
    const store = new Map<string, string>();
    const storage: Storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem(key: string, value: string) {
        store.set(key, value);
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    };
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: storage,
    });
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: matchMediaMatches,
        media: query,
        addEventListener(_event: string, listener: () => void) {
          systemThemeListeners.add(listener);
        },
        removeEventListener(_event: string, listener: () => void) {
          systemThemeListeners.delete(listener);
        },
      }) as unknown as MediaQueryList,
  });
});

beforeEach(() => {
  clearStorage();
  setEditorTheme();
  systemThemeListeners.clear();
  matchMediaMatches = false;
  mockMonaco = { editor: { setTheme: vi.fn() } };
});

afterEach(() => {
  clearStorage();
});

describe('useGraphiQLSettings — defaults', () => {
  it('returns default theme auto', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.theme).toBe('auto');
  });

  it('returns default density comfortable', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.density).toBe('comfortable');
  });

  it('returns default fontSize default', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.fontSize).toBe('default');
  });
});

describe('useGraphiQLSettings — reads from localStorage', () => {
  it('reads stored theme', () => {
    setStorage({ theme: 'dark' });
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.theme).toBe('dark');
  });

  it('reads stored density', () => {
    setStorage({ density: 'compact' });
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.density).toBe('compact');
  });

  it('reads stored fontSize', () => {
    setStorage({ fontSize: 'large' });
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.fontSize).toBe('large');
  });

  it('falls back to defaults for missing keys', () => {
    setStorage({ theme: 'light' });
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.density).toBe('comfortable');
    expect(result.current.fontSize).toBe('default');
  });

  it('falls back to defaults for corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json}');
    const { result } = renderHook(() => useGraphiQLSettings());
    expect(result.current.theme).toBe('auto');
    expect(result.current.density).toBe('comfortable');
    expect(result.current.fontSize).toBe('default');
  });
});

describe('useGraphiQLSettings — setters persist to localStorage', () => {
  it('shares updates between mounted consumers without overwriting other preferences', () => {
    const first = renderHook(() => useGraphiQLSettings());
    const second = renderHook(() => useGraphiQLSettings());

    act(() => first.result.current.setTheme('dark'));
    expect(second.result.current.theme).toBe('dark');

    act(() => second.result.current.setDensity('compact'));
    expect(first.result.current.density).toBe('compact');
    expect(first.result.current.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      theme: 'dark',
      density: 'compact',
    });

    const third = renderHook(() => useGraphiQLSettings());
    expect(third.result.current.theme).toBe('dark');
    expect(third.result.current.density).toBe('compact');
  });

  it('keeps consumers synchronized when storage rejects a write', () => {
    const first = renderHook(() => useGraphiQLSettings());
    const second = renderHook(() => useGraphiQLSettings());
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    try {
      act(() => first.result.current.setTheme('dark'));
      expect(second.result.current.theme).toBe('dark');
      expect(renderHook(() => useGraphiQLSettings()).result.current.theme).toBe(
        'dark',
      );
    } finally {
      setItem.mockRestore();
    }

    act(() => second.result.current.setDensity('compact'));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      theme: 'dark',
      density: 'compact',
    });
  });

  it('restores preferences after all consumers unmount', () => {
    const first = renderHook(() => useGraphiQLSettings());
    act(() => first.result.current.setFontSize('large'));
    first.unmount();

    const second = renderHook(() => useGraphiQLSettings());
    expect(second.result.current.fontSize).toBe('large');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      fontSize: 'large',
    });
  });

  it('setTheme persists the new theme', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY)!,
    ) as GraphiQLSettings;
    expect(stored.theme).toBe('dark');
  });

  it('setDensity persists the new density', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    act(() => {
      result.current.setDensity('spacious');
    });
    expect(result.current.density).toBe('spacious');
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY)!,
    ) as GraphiQLSettings;
    expect(stored.density).toBe('spacious');
  });

  it('setFontSize persists the new fontSize', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    act(() => {
      result.current.setFontSize('xl');
    });
    expect(result.current.fontSize).toBe('xl');
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY)!,
    ) as GraphiQLSettings;
    expect(stored.fontSize).toBe('xl');
  });
});

describe('useGraphiQLSettings — data-* attributes on container', () => {
  it('applies data-density and data-font-size on mount', () => {
    const container = document.createElement('div');
    container.className = 'graphiql-container';
    document.body.append(container);

    setStorage({ theme: 'light', density: 'compact', fontSize: 'large' });
    renderHook(() => useGraphiQLSettings());

    expect(container.getAttribute('data-theme')).toBe('light');
    expect(container.getAttribute('data-density')).toBe('compact');
    expect(container.getAttribute('data-font-size')).toBe('large');

    container.remove();
  });

  it('updates attributes when settings change', () => {
    const container = document.createElement('div');
    container.className = 'graphiql-container';
    document.body.append(container);

    const { result } = renderHook(() => useGraphiQLSettings());

    act(() => {
      result.current.setDensity('spacious');
    });

    expect(container.getAttribute('data-density')).toBe('spacious');

    container.remove();
  });

  it('applies resolved theme to container via containerRef', () => {
    const container = document.createElement('div');
    const ref = { current: container };

    setStorage({ theme: 'dark' });
    renderHook(() => useGraphiQLSettings(ref));

    expect(container.getAttribute('data-theme')).toBe('dark');
  });
});

describe('useGraphiQLSettings — auto theme', () => {
  it('resolves auto to dark when prefers-color-scheme: dark', () => {
    matchMediaMatches = true;

    const container = document.createElement('div');
    container.className = 'graphiql-container';
    document.body.append(container);

    renderHook(() => useGraphiQLSettings());

    expect(container.getAttribute('data-theme')).toBe('dark');

    container.remove();
  });

  it('resolves auto to light when prefers-color-scheme: light', () => {
    // matchMediaMatches is false by default (set in beforeEach)
    const container = document.createElement('div');
    container.className = 'graphiql-container';
    document.body.append(container);

    renderHook(() => useGraphiQLSettings());

    expect(container.getAttribute('data-theme')).toBe('light');

    container.remove();
  });
});

describe('useGraphiQLSettings — drives the Monaco theme', () => {
  it('applies the resolved theme to Monaco on mount', () => {
    setStorage({ theme: 'dark' });
    renderHook(() => useGraphiQLSettings());

    expect(mockMonaco!.editor.setTheme).toHaveBeenCalledWith(
      MONACO_THEME_NAME.dark,
    );
  });

  it('calls monaco.editor.setTheme with the light theme name on setTheme("light")', () => {
    const { result } = renderHook(() => useGraphiQLSettings());

    act(() => {
      result.current.setTheme('light');
    });

    expect(mockMonaco!.editor.setTheme).toHaveBeenCalledWith(
      MONACO_THEME_NAME.light,
    );
  });

  it('calls monaco.editor.setTheme with the dark theme name on setTheme("dark")', () => {
    const { result } = renderHook(() => useGraphiQLSettings());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(mockMonaco!.editor.setTheme).toHaveBeenCalledWith(
      MONACO_THEME_NAME.dark,
    );
  });

  it('does not call monaco.editor.setTheme when monaco is not yet initialized', () => {
    mockMonaco = undefined;
    const { result } = renderHook(() => useGraphiQLSettings());

    act(() => {
      result.current.setTheme('dark');
    });

    // Nothing to assert on `setTheme` itself since there's no monaco
    // instance, but the hook must not throw when monaco is unavailable.
    expect(result.current.theme).toBe('dark');
  });
});

describe('useGraphiQLSettings — registered editor themes', () => {
  beforeEach(() => {
    setEditorTheme({ light: 'company-light', dark: 'company-dark' });
  });

  it.each([false, true])(
    'preserves the custom theme on cold initialization with dark system preference %s',
    dark => {
      matchMediaMatches = dark;
      renderHook(() => useGraphiQLSettings());
      expect(mockMonaco!.editor.setTheme).toHaveBeenLastCalledWith(
        dark ? 'company-dark' : 'company-light',
      );
    },
  );

  it.each(['light', 'dark'] as const)(
    'restores the custom %s theme from saved settings',
    theme => {
      setStorage({ theme });
      renderHook(() => useGraphiQLSettings());
      expect(mockMonaco!.editor.setTheme).toHaveBeenLastCalledWith(
        `company-${theme}`,
      );
    },
  );

  it('keeps custom names when Settings switches between light and dark', () => {
    const { result } = renderHook(() => useGraphiQLSettings());
    for (const theme of ['dark', 'light'] as const) {
      act(() => result.current.setTheme(theme));
      expect(mockMonaco!.editor.setTheme).toHaveBeenLastCalledWith(
        `company-${theme}`,
      );
    }
  });

  it('follows system changes in Auto with the registered names and removes its listener on unmount', () => {
    const container = document.createElement('div');
    const { unmount } = renderHook(() =>
      useGraphiQLSettings({ current: container }),
    );
    changeSystemTheme(true);
    expect(container).toHaveAttribute('data-theme', 'dark');
    expect(mockMonaco!.editor.setTheme).toHaveBeenLastCalledWith(
      'company-dark',
    );
    changeSystemTheme(false);
    expect(container).toHaveAttribute('data-theme', 'light');
    expect(mockMonaco!.editor.setTheme).toHaveBeenLastCalledWith(
      'company-light',
    );
    unmount();
    expect(systemThemeListeners.size).toBe(0);
  });

  it('keeps explicit selection when the system theme changes', () => {
    setStorage({ theme: 'light' });
    renderHook(() => useGraphiQLSettings());
    changeSystemTheme(true);
    expect(mockMonaco!.editor.setTheme).toHaveBeenLastCalledWith(
      'company-light',
    );
  });

  it('applies the registered name once Monaco finishes initializing', () => {
    mockMonaco = undefined;
    setStorage({ theme: 'dark' });
    const { rerender } = renderHook(() => useGraphiQLSettings());
    mockMonaco = { editor: { setTheme: vi.fn() } };
    rerender();
    expect(mockMonaco.editor.setTheme).toHaveBeenLastCalledWith('company-dark');
  });

  it('uses a theme selected by another consumer before Monaco initializes', () => {
    mockMonaco = undefined;
    const shell = renderHook(() => useGraphiQLSettings());
    const dialog = renderHook(() => useGraphiQLSettings());

    act(() => dialog.result.current.setTheme('dark'));
    expect(shell.result.current.theme).toBe('dark');

    mockMonaco = { editor: { setTheme: vi.fn() } };
    shell.rerender();
    expect(mockMonaco.editor.setTheme).toHaveBeenLastCalledWith('company-dark');
  });
});
