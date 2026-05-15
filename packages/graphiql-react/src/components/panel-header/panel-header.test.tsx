'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PanelHeader } from './';

describe('PanelHeader', () => {
  it('renders the title', () => {
    render(<PanelHeader title="Schema" />);
    expect(screen.getByText('Schema')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<PanelHeader title="Schema" subtitle="Pokemon API" />);
    expect(screen.getByText('Pokemon API')).toBeInTheDocument();
  });

  it('does not render a subtitle element when omitted', () => {
    const { container } = render(<PanelHeader title="Schema" />);
    expect(
      container.querySelector('.graphiql-panel-header-subtitle'),
    ).toBeNull();
  });

  it('renders action icons when provided', () => {
    render(
      <PanelHeader
        title="Schema"
        actions={<button aria-label="Refresh">↻</button>}
      />,
    );
    expect(screen.getByLabelText('Refresh')).toBeInTheDocument();
  });

  it('does not render the actions container when omitted', () => {
    const { container } = render(<PanelHeader title="Schema" />);
    expect(
      container.querySelector('.graphiql-panel-header-actions'),
    ).toBeNull();
  });

  it('renders the title in an h2', () => {
    const { container } = render(<PanelHeader title="History" />);
    expect(container.querySelector('h2')).toHaveTextContent('History');
  });
});
