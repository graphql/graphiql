'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBarView } from './';

const DEFAULTS = { url: 'https://api.example.com/graphql' };

describe('TopBarView', () => {
  it('renders the run button passed into the slot', () => {
    render(
      <TopBarView
        {...DEFAULTS}
        runButton={<button type="button">Run</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
  });

  it('renders the GraphiQL wordmark', () => {
    render(<TopBarView {...DEFAULTS} />);
    expect(screen.getByText('GraphiQL')).toBeInTheDocument();
  });

  it('renders custom branding in place of the default wordmark', () => {
    const { queryByText } = render(
      <TopBarView {...DEFAULTS} brand={<span>My Company</span>} />,
    );
    expect(queryByText('My Company')).toBeInTheDocument();
    expect(queryByText('GraphiQL')).not.toBeInTheDocument();
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

  it('has role="banner" on the header element', () => {
    const { container } = render(<TopBarView {...DEFAULTS} />);
    expect(container.querySelector('header[role="banner"]')).not.toBeNull();
  });
});
