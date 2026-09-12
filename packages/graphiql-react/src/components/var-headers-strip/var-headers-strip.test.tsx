'use no memo';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import * as hooksModule from '../../utility/hooks';
import { VarHeadersStrip } from './';

// The editors depend on Monaco; mock them so tests run without a runtime.
// Both editors are always mounted; the inactive one is hidden via the
// `hidden` class, so forward `className` to assert visibility.
vi.mock('../variables-editor', () => ({
  VariablesEditor: (props: { className?: string }) => (
    <div data-testid="variables-editor" className={props.className} />
  ),
}));

vi.mock('../request-headers-editor', () => ({
  RequestHeadersEditor: (props: { className?: string }) => (
    <div data-testid="headers-editor" className={props.className} />
  ),
}));

// useEditorState depends on Monaco; stub it.
vi.mock('../../utility/hooks', () => ({
  useEditorState: vi.fn(() => ['', vi.fn()]),
}));

function renderStrip(ui: ReactNode = <VarHeadersStrip />) {
  return render(<T.Provider>{ui}</T.Provider>);
}

describe('VarHeadersStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooksModule.useEditorState).mockReturnValue(['', vi.fn()]);
  });

  it('renders both tab options', () => {
    renderStrip();
    expect(
      screen.getByRole('radio', { name: 'Variables' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Headers' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Snippets' })).toBeNull();
  });

  it('defaults the active tab to variables', () => {
    renderStrip();
    expect(screen.getByRole('radio', { name: 'Variables' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Headers' })).not.toBeChecked();
  });

  it('honours the defaultTab prop', () => {
    renderStrip(<VarHeadersStrip defaultTab="headers" />);
    expect(screen.getByRole('radio', { name: 'Headers' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Variables' })).not.toBeChecked();
  });

  it('switches the active tab when a tab is selected', async () => {
    const user = userEvent.setup();
    renderStrip();
    await user.click(screen.getByRole('radio', { name: 'Headers' }));
    expect(screen.getByRole('radio', { name: 'Headers' })).toBeChecked();
    expect(screen.getByTestId('headers-editor')).not.toHaveClass('hidden');
    expect(screen.getByTestId('variables-editor')).toHaveClass('hidden');
  });

  it('shows the variables editor when the variables tab is active', () => {
    renderStrip();
    expect(screen.getByTestId('variables-editor')).not.toHaveClass('hidden');
    expect(screen.getByTestId('headers-editor')).toHaveClass('hidden');
  });

  it('shows the headers editor when the headers tab is active', () => {
    renderStrip(<VarHeadersStrip defaultTab="headers" />);
    expect(screen.getByTestId('headers-editor')).not.toHaveClass('hidden');
    expect(screen.getByTestId('variables-editor')).toHaveClass('hidden');
  });

  it('does not show a validity hint when variables are empty', () => {
    renderStrip();
    expect(screen.queryByText(/valid/)).toBeNull();
    expect(screen.queryByText(/invalid/)).toBeNull();
  });

  describe('when headersEditorEnabled is false', () => {
    it('hides the Headers tab and renders only the variables editor', () => {
      renderStrip(<VarHeadersStrip headersEditorEnabled={false} />);
      expect(
        screen.getByRole('radio', { name: 'Variables' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: 'Headers' })).toBeNull();
      expect(screen.getByTestId('variables-editor')).not.toHaveClass('hidden');
      expect(screen.queryByTestId('headers-editor')).toBeNull();
    });

    it('ignores a defaultTab of "headers"', () => {
      renderStrip(
        <VarHeadersStrip headersEditorEnabled={false} defaultTab="headers" />,
      );
      expect(screen.getByRole('radio', { name: 'Variables' })).toBeChecked();
      expect(screen.getByTestId('variables-editor')).not.toHaveClass('hidden');
      expect(screen.queryByTestId('headers-editor')).toBeNull();
    });
  });
});

describe('variables validity hint', () => {
  let mockUseEditorState: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorState = vi.mocked(hooksModule.useEditorState);
  });

  it('shows a valid hint when variables parse correctly', () => {
    mockUseEditorState.mockReturnValue(['{"a": 1, "b": 2}', vi.fn()]);
    renderStrip();
    expect(screen.getByText('2 vars · valid')).toBeInTheDocument();
  });

  it('shows singular "var" for a single variable', () => {
    mockUseEditorState.mockReturnValue(['{"x": 42}', vi.fn()]);
    renderStrip();
    expect(screen.getByText('1 var · valid')).toBeInTheDocument();
  });

  it('shows "invalid JSON" hint when variables do not parse', () => {
    mockUseEditorState.mockReturnValue(['{bad json', vi.fn()]);
    renderStrip();
    expect(screen.getByText('invalid JSON')).toBeInTheDocument();
  });

  it('hides the hint when not on the variables tab', () => {
    mockUseEditorState.mockReturnValue(['{"a": 1}', vi.fn()]);
    renderStrip(<VarHeadersStrip defaultTab="headers" />);
    expect(screen.queryByText(/valid/)).toBeNull();
  });
});
