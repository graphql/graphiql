'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeycapHint } from './';

describe('KeycapHint', () => {
  it('renders the provided keys', () => {
    render(<KeycapHint keys={['⌘', 'K']} ariaLabel="Open command palette" />);
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('exposes the shortcut as an accessible name', () => {
    render(
      <KeycapHint keys={['⌘', 'Enter']} ariaLabel="Run query (Cmd+Enter)" />,
    );
    expect(screen.getByLabelText(/Run query/i)).toBeInTheDocument();
  });

  it('renders a <kbd> element for each key', () => {
    const { container } = render(
      <KeycapHint keys={['⌘', 'K']} ariaLabel="Open command palette" />,
    );
    expect(container.querySelectorAll('kbd')).toHaveLength(2);
  });
});
