import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsDialog, type SettingsDialogProps } from './index';
import { SETTINGS_STORAGE_KEY } from '../../hooks/use-graphiql-settings';

// The Monaco store performs dynamic imports of monaco-editor / monaco-graphql
// that don't resolve in jsdom. Stub it out so the dialog can render without
// a real editor environment.
vi.mock('../../stores/monaco', () => ({
  monacoStore: {
    getState: () => ({ monaco: undefined, monacoGraphQL: undefined }),
    subscribe: () => () => {},
  },
  useMonaco: (selector: (state: { monaco: undefined }) => unknown) =>
    selector({ monaco: undefined }),
}));

// The persist-headers and clear-storage controls read/write the GraphiQL store;
// mock the hooks so the dialog can render without a provider.
const mockSetShouldPersistHeaders = vi.fn();
const mockStorage = { clear: vi.fn() };
let mockShouldPersistHeaders = false;

type MockState = { shouldPersistHeaders: boolean; storage: typeof mockStorage };

vi.mock('../provider', () => ({
  useGraphiQL: (selector: (s: MockState) => unknown) =>
    selector({
      shouldPersistHeaders: mockShouldPersistHeaders,
      storage: mockStorage,
    }),
  useGraphiQLActions: () => ({
    setShouldPersistHeaders: mockSetShouldPersistHeaders,
  }),
}));

// Polyfill localStorage for environments that lack it.
beforeAll(() => {
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
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  });
});

beforeEach(() => {
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
  mockShouldPersistHeaders = false;
  mockSetShouldPersistHeaders.mockClear();
  mockStorage.clear.mockClear();
  // Ensure a graphiql-container exists for useGraphiQLSettings' DOM effect.
  const existing = document.querySelector('.graphiql-container');
  if (!existing) {
    const c = document.createElement('div');
    c.className = 'graphiql-container';
    document.body.append(c);
  }
});

function renderDialog(open = true, props: Partial<SettingsDialogProps> = {}) {
  const onOpenChange = vi.fn();
  render(<SettingsDialog open={open} onOpenChange={onOpenChange} {...props} />);
  return { onOpenChange };
}

describe('SettingsDialog — renders', () => {
  it('shows the Settings title when open', () => {
    renderDialog();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Theme, Density, and Font size section headings', () => {
    renderDialog();
    // Each section renders an h3 title and a fieldset legend — query by role.
    expect(screen.getAllByText('Theme').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Density').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Font size').length).toBeGreaterThanOrEqual(1);
    // Confirm the section headings are present as h3 elements.
    const headings = screen.getAllByRole('heading', { level: 3 });
    const headingTexts = headings.map(h => h.textContent);
    expect(headingTexts).toContain('Theme');
    expect(headingTexts).toContain('Density');
    expect(headingTexts).toContain('Font size');
  });
});

describe('SettingsDialog — theme control', () => {
  it('renders Auto / Light / Dark options', () => {
    renderDialog();
    const fieldset = screen.getByRole('group', { name: 'Theme' });
    expect(
      within(fieldset).getByRole('radio', { name: 'Auto' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Light' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Dark' }),
    ).toBeInTheDocument();
  });

  it('defaults to Auto', () => {
    renderDialog();
    const auto = screen.getByRole('radio', { name: 'Auto' });
    expect(auto).toBeChecked();
  });

  it('switches theme to Dark on click', async () => {
    const user = userEvent.setup();
    renderDialog();
    const dark = screen.getByRole('radio', { name: 'Dark' });
    await user.click(dark);
    expect(dark).toBeChecked();
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.theme).toBe('dark');
  });
});

describe('SettingsDialog — density control', () => {
  it('renders Compact / Comfortable / Spacious options', () => {
    renderDialog();
    const fieldset = screen.getByRole('group', { name: 'Density' });
    expect(
      within(fieldset).getByRole('radio', { name: 'Compact' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Comfortable' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Spacious' }),
    ).toBeInTheDocument();
  });

  it('defaults to Comfortable', () => {
    renderDialog();
    expect(screen.getByRole('radio', { name: 'Comfortable' })).toBeChecked();
  });

  it('switches density to Compact on click', async () => {
    const user = userEvent.setup();
    renderDialog();
    const fieldset = screen.getByRole('group', { name: 'Density' });
    const compact = within(fieldset).getByRole('radio', { name: 'Compact' });
    await user.click(compact);
    expect(compact).toBeChecked();
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.density).toBe('compact');
  });
});

describe('SettingsDialog — font size control', () => {
  it('renders Compact / Default / Large / Extra Large options', () => {
    renderDialog();
    const fieldset = screen.getByRole('group', { name: 'Font size' });
    expect(
      within(fieldset).getByRole('radio', { name: 'Compact' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Default' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Large' }),
    ).toBeInTheDocument();
    expect(
      within(fieldset).getByRole('radio', { name: 'Extra Large' }),
    ).toBeInTheDocument();
  });

  it('defaults to Default', () => {
    renderDialog();
    expect(screen.getByRole('radio', { name: 'Default' })).toBeChecked();
  });

  it('switches font size to Large on click', async () => {
    const user = userEvent.setup();
    renderDialog();
    const large = screen.getByRole('radio', { name: 'Large' });
    await user.click(large);
    expect(large).toBeChecked();
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.fontSize).toBe('large');
  });
});

describe('SettingsDialog — forcedTheme', () => {
  it('hides the Theme control when forcedTheme is set', () => {
    renderDialog(true, { forcedTheme: 'dark' });
    expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull();
    // Other controls remain.
    expect(screen.getByRole('group', { name: 'Density' })).toBeInTheDocument();
  });

  it('forces the theme into storage', async () => {
    renderDialog(true, { forcedTheme: 'light' });
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
      expect(stored.theme).toBe('light');
    });
  });

  it('ignores an unrecognized forcedTheme value', () => {
    renderDialog(true, { forcedTheme: 'nonsense' as never });
    // Invalid value is ignored, so the theme control stays visible.
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
  });
});

describe('SettingsDialog — persist headers', () => {
  it('is hidden unless showPersistHeadersSettings is set', () => {
    renderDialog();
    expect(screen.queryByRole('group', { name: 'Persist headers' })).toBeNull();
  });

  it('renders On / Off reflecting the current value', () => {
    mockShouldPersistHeaders = true;
    renderDialog(true, { showPersistHeadersSettings: true });
    const fieldset = screen.getByRole('group', { name: 'Persist headers' });
    expect(within(fieldset).getByRole('radio', { name: 'On' })).toBeChecked();
    expect(
      within(fieldset).getByRole('radio', { name: 'Off' }),
    ).not.toBeChecked();
  });

  it('calls setShouldPersistHeaders(true) when On is clicked', async () => {
    const user = userEvent.setup();
    renderDialog(true, { showPersistHeadersSettings: true });
    const fieldset = screen.getByRole('group', { name: 'Persist headers' });
    await user.click(within(fieldset).getByRole('radio', { name: 'On' }));
    expect(mockSetShouldPersistHeaders).toHaveBeenCalledWith(true);
  });
});

describe('SettingsDialog — clear storage', () => {
  it('clears storage when clicked', async () => {
    const user = userEvent.setup();
    renderDialog();
    const button = screen.getByRole('button', { name: 'Clear data' });
    await user.click(button);
    expect(mockStorage.clear).toHaveBeenCalledOnce();
    // The label stays put — the checkmark swaps in over it, so the button
    // keeps its accessible name.
    expect(button).toHaveAccessibleName('Clear data');
  });

  it('briefly swaps the label for a checkmark, then reverts', () => {
    vi.useFakeTimers();
    try {
      renderDialog();
      const button = screen.getByRole('button', { name: 'Clear data' });

      expect(button).not.toHaveAttribute('data-confirmed');
      expect(screen.getByRole('status')).toBeEmptyDOMElement();

      fireEvent.click(button);
      expect(button).toHaveAttribute('data-confirmed');
      expect(screen.getByRole('status')).toHaveTextContent('Data cleared');

      act(() => {
        vi.advanceTimersByTime(1499);
      });
      expect(button).toHaveAttribute('data-confirmed');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(button).not.toHaveAttribute('data-confirmed');
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('SettingsDialog — closed state', () => {
  it('does not render content when closed', () => {
    renderDialog(false);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });
});
