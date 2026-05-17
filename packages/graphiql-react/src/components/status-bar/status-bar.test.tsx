'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildSchema } from 'graphql';
import { StatusBarView } from './';

const SCHEMA = buildSchema(`type Query { hello: String }`);

const CONNECTED_DEFAULTS = {
  isConnected: true,
  typeCount: Object.keys(SCHEMA.getTypeMap()).length,
  pluginCount: 0,
};

const DISCONNECTED_DEFAULTS = {
  isConnected: false,
  typeCount: 0,
  pluginCount: 0,
};

describe('StatusBarView', () => {
  it('shows "Disconnected" when not connected', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows "Connected" when connected', () => {
    render(<StatusBarView {...CONNECTED_DEFAULTS} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows type count when connected', () => {
    render(<StatusBarView {...CONNECTED_DEFAULTS} />);
    expect(
      screen.getByText(`${CONNECTED_DEFAULTS.typeCount} types`),
    ).toBeInTheDocument();
  });

  it('does not show type count when disconnected', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.queryByText(/types/)).toBeNull();
  });

  it('shows plugin count when plugins are registered', () => {
    render(<StatusBarView {...CONNECTED_DEFAULTS} pluginCount={2} />);
    expect(screen.getByText('2 plugins')).toBeInTheDocument();
  });

  it('uses singular "plugin" for one plugin', () => {
    render(<StatusBarView {...CONNECTED_DEFAULTS} pluginCount={1} />);
    expect(screen.getByText('1 plugin')).toBeInTheDocument();
  });

  it('does not show plugin count when no plugins are registered', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.queryByText(/plugin/)).toBeNull();
  });

  it('shows cursor position when provided', () => {
    render(
      <StatusBarView
        {...DISCONNECTED_DEFAULTS}
        cursorPosition={{ line: 4, column: 12 }}
      />,
    );
    expect(screen.getByText('Ln 4, Col 12')).toBeInTheDocument();
  });

  it('does not show cursor position when omitted', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.queryByText(/Ln/)).toBeNull();
  });

  it('shows default encoding', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
  });

  it('shows custom encoding', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} encoding="UTF-16" />);
    expect(screen.getByText('UTF-16')).toBeInTheDocument();
  });

  it('renders a status dot inside the connection label', () => {
    const { container } = render(<StatusBarView {...CONNECTED_DEFAULTS} />);
    expect(
      container.querySelector(
        '.graphiql-status-bar-conn.connected .graphiql-status-bar-conn-dot',
      ),
    ).not.toBeNull();
  });

  it('always shows the GraphQL language label', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
  });

  it('renders as a footer with role contentinfo', () => {
    render(<StatusBarView {...DISCONNECTED_DEFAULTS} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
