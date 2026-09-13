'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeycapHint, MODIFIER } from './';

// jsdom's default userAgent does not include "Mac", so `isMacOs` is false here.
describe('KeycapHint (non-macOS)', () => {
  it('renders MODIFIER.Meta as "Ctrl"', () => {
    render(
      <KeycapHint
        keys={[MODIFIER.Meta, 'K']}
        ariaLabel="Open command palette"
      />,
    );
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders other modifiers as plain text', () => {
    render(
      <KeycapHint keys={[MODIFIER.Shift, MODIFIER.Alt]} ariaLabel="Combo" />,
    );
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('Alt')).toBeInTheDocument();
  });

  it('always renders Enter as ⏎', () => {
    render(<KeycapHint keys={[MODIFIER.Enter]} ariaLabel="Submit" />);
    expect(screen.getByText('⏎')).toBeInTheDocument();
  });

  it('passes unknown strings through unchanged', () => {
    render(<KeycapHint keys={['F1']} ariaLabel="Command palette" />);
    expect(screen.getByText('F1')).toBeInTheDocument();
  });

  it('exposes the shortcut as an accessible name', () => {
    render(
      <KeycapHint
        keys={[MODIFIER.Meta, MODIFIER.Enter]}
        ariaLabel="Run query (Ctrl+Enter)"
      />,
    );
    expect(screen.getByLabelText(/Run query/i)).toBeInTheDocument();
  });

  it('renders a <kbd> element for each key', () => {
    const { container } = render(
      <KeycapHint
        keys={[MODIFIER.Meta, 'K']}
        ariaLabel="Open command palette"
      />,
    );
    expect(container.querySelectorAll('kbd')).toHaveLength(2);
  });
});
