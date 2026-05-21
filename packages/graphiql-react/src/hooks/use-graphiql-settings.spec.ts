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
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  });
});

beforeEach(() => {
  clearStorage();
  matchMediaMatches = false;
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
