'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBarView } from './';

const DEFAULTS = {
  isFetching: false,
  url: 'https://api.example.com/graphql',
  method: 'POST' as const,
  supportedMethods: ['POST' as const],
  onRun() {},
  onSetMethod(_method: 'GET' | 'POST') {},
};

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

  it('shows the static method label when only one method is supported', () => {
    render(
      <TopBarView {...DEFAULTS} method="POST" supportedMethods={['POST']} />,
    );
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: /HTTP method/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the GET/POST switcher when two methods are supported', () => {
    render(
      <TopBarView
        {...DEFAULTS}
        method="POST"
        supportedMethods={['GET', 'POST']}
      />,
    );
    const group = screen.getByRole('group', { name: /HTTP method/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GET' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'POST' })).toBeInTheDocument();
  });

  it('marks the active method as pressed in the switcher', () => {
    render(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
      />,
    );
    expect(screen.getByRole('button', { name: 'GET' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'POST' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onSetMethod when a method option is clicked', async () => {
    const user = userEvent.setup();
    const onSetMethod = vi.fn();
    render(
      <TopBarView
        {...DEFAULTS}
        method="POST"
        supportedMethods={['GET', 'POST']}
        onSetMethod={onSetMethod}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'GET' }));
    expect(onSetMethod).toHaveBeenCalledWith('GET');
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
