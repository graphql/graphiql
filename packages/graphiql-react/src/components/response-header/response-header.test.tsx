'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../tooltip';
import { ResponseHeader } from './';

function renderWithTooltip(ui: React.ReactElement) {
  return render(<Tooltip.Provider>{ui}</Tooltip.Provider>);
}

describe('ResponseHeader', () => {
  it('renders the view toggle with all three options', () => {
    renderWithTooltip(<ResponseHeader view="json" onViewChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tree' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Table' })).toBeInTheDocument();
  });

  it('marks the active view as checked', () => {
    renderWithTooltip(<ResponseHeader view="tree" onViewChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Tree' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'JSON' })).not.toBeChecked();
  });

  it('calls onViewChange when a different view is selected', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    renderWithTooltip(
      <ResponseHeader view="json" onViewChange={onViewChange} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Tree' }));
    expect(onViewChange).toHaveBeenCalledWith('tree');
  });

  it('renders status code when provided', () => {
    renderWithTooltip(
      <ResponseHeader status={200} view="json" onViewChange={() => {}} />,
    );
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('does not render status when omitted', () => {
    const { container } = renderWithTooltip(
      <ResponseHeader view="json" onViewChange={() => {}} />,
    );
    expect(container.querySelector('.graphiql-response-status')).toBeNull();
  });

  it('renders time in ms when provided', () => {
    renderWithTooltip(
      <ResponseHeader timeMs={42} view="json" onViewChange={() => {}} />,
    );
    expect(screen.getByText('42ms')).toBeInTheDocument();
  });

  it('renders size in bytes when provided', () => {
    renderWithTooltip(
      <ResponseHeader sizeBytes={512} view="json" onViewChange={() => {}} />,
    );
    expect(screen.getByText('512 B')).toBeInTheDocument();
  });

  it('formats size in KB for values >= 1024', () => {
    renderWithTooltip(
      <ResponseHeader sizeBytes={2048} view="json" onViewChange={() => {}} />,
    );
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('renders the copy button when onCopy is provided', () => {
    renderWithTooltip(
      <ResponseHeader view="json" onViewChange={() => {}} onCopy={() => {}} />,
    );
    expect(
      screen.getByRole('button', { name: 'Copy response' }),
    ).toBeInTheDocument();
  });

  it('hides the copy button when onCopy is omitted', () => {
    renderWithTooltip(<ResponseHeader view="json" onViewChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Copy response' })).toBeNull();
  });

  it('calls onCopy when the copy button is clicked', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderWithTooltip(
      <ResponseHeader view="json" onViewChange={() => {}} onCopy={onCopy} />,
    );
    await user.click(screen.getByRole('button', { name: 'Copy response' }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('shows error styling for status 0', () => {
    const { container } = renderWithTooltip(
      <ResponseHeader status={0} view="json" onViewChange={() => {}} />,
    );
    expect(
      container.querySelector('.graphiql-response-status--error'),
    ).toBeInTheDocument();
  });

  it('shows error styling for status >= 400', () => {
    const { container } = renderWithTooltip(
      <ResponseHeader status={500} view="json" onViewChange={() => {}} />,
    );
    expect(
      container.querySelector('.graphiql-response-status--error'),
    ).toBeInTheDocument();
  });

  it('shows ok styling for status 200', () => {
    const { container } = renderWithTooltip(
      <ResponseHeader status={200} view="json" onViewChange={() => {}} />,
    );
    expect(
      container.querySelector('.graphiql-response-status--ok'),
    ).toBeInTheDocument();
  });
});
