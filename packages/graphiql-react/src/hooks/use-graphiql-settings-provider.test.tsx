import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { GraphiQLProvider } from '../components/provider';
import {
  useGraphiQLSettings,
  SETTINGS_STORAGE_KEY,
} from './use-graphiql-settings';

const { setTheme } = vi.hoisted(() => ({ setTheme: vi.fn() }));
vi.mock('../stores/monaco', () => {
  const state = {
    monaco: { editor: { setTheme } },
    actions: { async initialize() {} },
  };
  return {
    monacoStore: { getState: () => state, subscribe: () => () => {} },
    useMonaco: (selector?: (value: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

beforeEach(() => {
  localStorage.clear();
  setTheme.mockClear();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});

describe('appearance settings with provider context', () => {
  it('applies the editorTheme prop retained by the provider store', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ theme: 'dark' }),
    );
    renderHook(() => useGraphiQLSettings(), {
      wrapper: ({ children }) => (
        <GraphiQLProvider
          fetcher={async () => ({ data: {} })}
          schema={null}
          editorTheme={{ light: 'company-light', dark: 'company-dark' }}
        >
          {children}
        </GraphiQLProvider>
      ),
    });
    expect(setTheme).toHaveBeenLastCalledWith('company-dark');
  });

  it('still works outside a provider using the built-in theme', () => {
    renderHook(() => useGraphiQLSettings());
    expect(setTheme).toHaveBeenLastCalledWith('graphiql-LIGHT');
  });
});
