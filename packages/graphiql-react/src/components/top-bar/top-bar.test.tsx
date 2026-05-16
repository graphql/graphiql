'use no memo';

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphiQLProvider } from '../provider';
import { TopBar } from './';

// jsdom doesn't implement window.matchMedia; stub it so GraphiQLProvider
// can resolve the initial theme without throwing.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

const noOpFetcher = () => Promise.resolve({ data: {} });

function renderInProvider(ui: React.ReactElement) {
  return render(
    <GraphiQLProvider fetcher={noOpFetcher}>{ui}</GraphiQLProvider>,
  );
}

describe('TopBar', () => {
  it('renders the Run button', () => {
    renderInProvider(<TopBar />);
    expect(
      screen.getByRole('button', { name: /Run query/i }),
    ).toBeInTheDocument();
  });

  it('renders the GraphiQL wordmark', () => {
    renderInProvider(<TopBar />);
    expect(screen.getByText('GraphiQL')).toBeInTheDocument();
  });

  it('renders the version pill when provided', () => {
    renderInProvider(<TopBar version="v6.0.0-alpha.1" />);
    expect(screen.getByText('v6.0.0-alpha.1')).toBeInTheDocument();
  });

  it('does not render the version pill when omitted', () => {
    const { container } = renderInProvider(<TopBar />);
    expect(container.querySelector('.graphiql-top-bar-version')).toBeNull();
  });

  it('renders the endpoint URL when provided', () => {
    renderInProvider(<TopBar endpointUrl="https://api.example.com/graphql" />);
    expect(
      screen.getByText('https://api.example.com/graphql'),
    ).toBeInTheDocument();
  });

  it('falls back to /graphql when endpointUrl is omitted', () => {
    renderInProvider(<TopBar />);
    expect(screen.getByText('/graphql')).toBeInTheDocument();
  });

  it('calls run when the Run button is clicked', async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn(() => Promise.resolve({ data: {} }));
    render(
      <GraphiQLProvider fetcher={fetcher}>
        <TopBar />
      </GraphiQLProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Run query/i }));
    expect(fetcher).toHaveBeenCalled();
  });

  it('renders the command palette button', () => {
    renderInProvider(<TopBar />);
    expect(screen.getByText('Jump to schema')).toBeInTheDocument();
  });

  it('has role="banner" on the header element', () => {
    const { container } = renderInProvider(<TopBar />);
    expect(container.querySelector('header[role="banner"]')).not.toBeNull();
  });
});
