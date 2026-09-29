'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidePanelView } from './';

const MOCK_PLUGIN = {
  title: 'Test Plugin',
  content: () => <div>Plugin content</div>,
};

describe('SidePanelView', () => {
  it('renders the plugin content inside the panel', () => {
    render(<SidePanelView plugin={MOCK_PLUGIN} />);
    expect(screen.getByText('Plugin content')).toBeInTheDocument();
  });

  it('renders as an aside element with aria-label matching the plugin title', () => {
    const { container } = render(<SidePanelView plugin={MOCK_PLUGIN} />);
    const aside = container.querySelector('aside.graphiql-side-panel');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute('aria-label', 'Test Plugin');
  });

  it('renders a different aria-label when the plugin title changes', () => {
    const { container, rerender } = render(
      <SidePanelView plugin={MOCK_PLUGIN} />,
    );
    rerender(
      <SidePanelView
        plugin={{ title: 'Other', content: () => <div>Other</div> }}
      />,
    );
    expect(
      container.querySelector('aside.graphiql-side-panel'),
    ).toHaveAttribute('aria-label', 'Other');
  });
});
