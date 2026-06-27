'use no memo';

import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBarView } from './';
import { Tooltip } from '../tooltip';

const DEFAULTS = {
  isFetching: false,
  url: 'https://api.example.com/graphql',
  method: 'POST' as const,
  supportedMethods: ['POST' as const],
  onRun() {},
  onSetMethod(_method: 'GET' | 'POST') {},
};

// The method toggle renders a Tooltip, which needs a provider ancestor.
const renderTopBar = (ui: ReactElement) =>
  render(<Tooltip.Provider>{ui}</Tooltip.Provider>);

describe('TopBarView', () => {
  it('renders the Run button', () => {
    render(<TopBarView {...DEFAULTS} />);
    expect(
      screen.getByRole('button', { name: /Run query/i }),
    ).toBeInTheDocument();
  });

  it('renders the GraphiQL wordmark', () => {
    render(<TopBarView {...DEFAULTS} />);
    expect(screen.getByText('GraphiQL')).toBeInTheDocument();
  });

  it('renders the version pill when provided', () => {
    render(<TopBarView {...DEFAULTS} version="v6.0.0-alpha.1" />);
    expect(screen.getByText('v6.0.0-alpha.1')).toBeInTheDocument();
  });

  it('does not render the version pill when omitted', () => {
    const { container } = render(<TopBarView {...DEFAULTS} />);
    expect(container.querySelector('.graphiql-top-bar-version')).toBeNull();
  });

  it('renders the endpoint URL', () => {
    render(<TopBarView {...DEFAULTS} url="https://api.example.com/graphql" />);
    expect(
      screen.getByText('https://api.example.com/graphql'),
    ).toBeInTheDocument();
  });

  it('renders the em-dash placeholder when url is —', () => {
    render(<TopBarView {...DEFAULTS} url="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows a static method label, not a button, when only one method is supported', () => {
    renderTopBar(
      <TopBarView {...DEFAULTS} method="POST" supportedMethods={['POST']} />,
    );
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'POST' }),
    ).not.toBeInTheDocument();
  });

  it('shows a single toggle button for the active method when two are supported', () => {
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="POST"
        supportedMethods={['GET', 'POST']}
      />,
    );
    expect(screen.getByRole('button', { name: 'POST' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'GET' }),
    ).not.toBeInTheDocument();
  });

  it('toggles to the other method when clicked (POST active → GET)', async () => {
    const user = userEvent.setup();
    const onSetMethod = vi.fn();
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="POST"
        supportedMethods={['GET', 'POST']}
        onSetMethod={onSetMethod}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'POST' }));
    expect(onSetMethod).toHaveBeenCalledWith('GET');
  });

  it('toggles to the other method when clicked (GET active → POST)', async () => {
    const user = userEvent.setup();
    const onSetMethod = vi.fn();
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
        onSetMethod={onSetMethod}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'GET' }));
    expect(onSetMethod).toHaveBeenCalledWith('POST');
  });

  it('calls onRun when the Run button is clicked', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<TopBarView {...DEFAULTS} onRun={onRun} />);
    await user.click(screen.getByRole('button', { name: /Run query/i }));
    expect(onRun).toHaveBeenCalled();
  });

  it('disables the Run button while fetching', () => {
    render(<TopBarView {...DEFAULTS} isFetching />);
    expect(screen.getByRole('button', { name: /Run query/i })).toBeDisabled();
  });

  it('renders the command palette button', () => {
    render(<TopBarView {...DEFAULTS} />);
    expect(screen.getByText('Jump to schema')).toBeInTheDocument();
  });

  it('has role="banner" on the header element', () => {
    const { container } = render(<TopBarView {...DEFAULTS} />);
    expect(container.querySelector('header[role="banner"]')).not.toBeNull();
  });
});
