'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBarView } from './';

const DEFAULTS = {
  isFetching: false,
  onRun: () => {},
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

  it('renders the endpoint URL when provided', () => {
    render(
      <TopBarView
        {...DEFAULTS}
        endpointUrl="https://api.example.com/graphql"
      />,
    );
    expect(
      screen.getByText('https://api.example.com/graphql'),
    ).toBeInTheDocument();
  });

  it('falls back to /graphql when endpointUrl is omitted', () => {
    render(<TopBarView {...DEFAULTS} />);
    expect(screen.getByText('/graphql')).toBeInTheDocument();
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
