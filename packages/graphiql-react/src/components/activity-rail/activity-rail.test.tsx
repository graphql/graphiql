'use no memo';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import type { GraphiQLPlugin } from '../../stores/plugin';
import { ActivityRail } from './';

const DocsIcon = () => <svg data-testid="docs-icon" />;
const HistoryIcon = () => <svg data-testid="history-icon" />;

const DOCS_PLUGIN: GraphiQLPlugin = {
  title: 'Documentation Explorer',
  icon: DocsIcon,
  content: () => null,
};

const HISTORY_PLUGIN: GraphiQLPlugin = {
  title: 'History',
  icon: HistoryIcon,
  content: () => null,
};

const mockSetVisiblePlugin = vi.fn();

vi.mock('../provider', () => ({
  useGraphiQL: vi.fn(),
  useGraphiQLActions: vi.fn(),
}));

import { useGraphiQL, useGraphiQLActions } from '../provider';

const mockUseGraphiQL = vi.mocked(useGraphiQL);
const mockUseGraphiQLActions = vi.mocked(useGraphiQLActions);

function renderWithProvider(ui: ReactNode) {
  return render(<T.Provider>{ui}</T.Provider>);
}

function setup(visiblePlugin: GraphiQLPlugin | null = null) {
  mockUseGraphiQL.mockImplementation((selector: (s: any) => any) => {
    const state = {
      plugins: [DOCS_PLUGIN, HISTORY_PLUGIN],
      visiblePlugin,
    };
    return selector(state);
  });
  mockUseGraphiQLActions.mockReturnValue({
    setVisiblePlugin: mockSetVisiblePlugin,
  } as any);
}

describe('ActivityRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a button for each plugin', () => {
    setup();
    renderWithProvider(<ActivityRail />);
    expect(
      screen.getByRole('button', { name: 'Show Documentation Explorer' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show History' }),
    ).toBeInTheDocument();
  });

  it('marks the active plugin with aria-pressed=true', () => {
    setup(DOCS_PLUGIN);
    renderWithProvider(<ActivityRail />);
    expect(
      screen.getByRole('button', { name: 'Hide Documentation Explorer' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Show History' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setVisiblePlugin with the plugin when an inactive button is clicked', async () => {
    const user = userEvent.setup();
    setup(null);
    renderWithProvider(<ActivityRail />);
    await user.click(
      screen.getByRole('button', { name: 'Show Documentation Explorer' }),
    );
    expect(mockSetVisiblePlugin).toHaveBeenCalledWith(DOCS_PLUGIN);
  });

  it('calls setVisiblePlugin(null) when the active plugin button is clicked', async () => {
    const user = userEvent.setup();
    setup(DOCS_PLUGIN);
    renderWithProvider(<ActivityRail />);
    await user.click(
      screen.getByRole('button', { name: 'Hide Documentation Explorer' }),
    );
    expect(mockSetVisiblePlugin).toHaveBeenCalledWith(null);
  });

  it('renders inside a <nav> with aria-label="Plugins"', () => {
    setup();
    renderWithProvider(<ActivityRail />);
    expect(
      screen.getByRole('navigation', { name: 'Plugins' }),
    ).toBeInTheDocument();
  });

  it('renders the settings button when onSettingsClick is provided', () => {
    setup();
    renderWithProvider(<ActivityRail onSettingsClick={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Settings' }),
    ).toBeInTheDocument();
  });

  it('does not render the settings button without onSettingsClick', () => {
    setup();
    renderWithProvider(<ActivityRail />);
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
  });

  it('calls onSettingsClick when the settings button is clicked', async () => {
    const user = userEvent.setup();
    const onSettingsClick = vi.fn();
    setup();
    renderWithProvider(<ActivityRail onSettingsClick={onSettingsClick} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onSettingsClick).toHaveBeenCalledOnce();
  });
});
