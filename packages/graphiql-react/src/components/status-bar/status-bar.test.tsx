'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildSchema } from 'graphql';
import { StatusBarView } from './';

const SCHEMA = buildSchema(`type Query { hello: String }`);
const typeCount = Object.keys(SCHEMA.getTypeMap()).length;

describe('StatusBarView', () => {
  it('shows "Idle" when no schema has been loaded and nothing is in flight', () => {
    render(<StatusBarView connectionStatus="idle" typeCount={0} />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('shows "Connecting" while introspecting or fetching', () => {
    render(<StatusBarView connectionStatus="connecting" typeCount={0} />);
    expect(screen.getByText('Connecting')).toBeInTheDocument();
  });

  it('shows "Connected" once a schema is loaded', () => {
    render(
      <StatusBarView connectionStatus="connected" typeCount={typeCount} />,
    );
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows "Connection error" when the last request failed', () => {
    render(<StatusBarView connectionStatus="error" typeCount={0} />);
    expect(screen.getByText('Connection error')).toBeInTheDocument();
  });

  it('renders a status dot reflecting the connection state', () => {
    const { container } = render(
      <StatusBarView connectionStatus="connected" typeCount={typeCount} />,
    );
    expect(
      container.querySelector(
        '.graphiql-status-bar-conn-connected .graphiql-status-bar-conn-dot',
      ),
    ).not.toBeNull();
  });

  it('sets an accessible title matching the connection label', () => {
    const { container } = render(
      <StatusBarView connectionStatus="error" typeCount={0} />,
    );
    expect(
      container
        .querySelector('.graphiql-status-bar-conn')
        ?.getAttribute('title'),
    ).toBe('Connection error');
  });

  it('shows type count once connected', () => {
    render(
      <StatusBarView connectionStatus="connected" typeCount={typeCount} />,
    );
    expect(screen.getByText(`${typeCount} types`)).toBeInTheDocument();
  });

  it('shows type count while an error is present (schema already loaded)', () => {
    render(<StatusBarView connectionStatus="error" typeCount={typeCount} />);
    expect(screen.getByText(`${typeCount} types`)).toBeInTheDocument();
  });

  it('does not show type count when idle', () => {
    render(<StatusBarView connectionStatus="idle" typeCount={0} />);
    expect(screen.queryByText(/types/)).toBeNull();
  });

  it('does not show a plugin count', () => {
    render(
      <StatusBarView connectionStatus="connected" typeCount={typeCount} />,
    );
    expect(screen.queryByText(/plugins?/)).toBeNull();
  });

  it('does not show the UTF-8 encoding label', () => {
    render(
      <StatusBarView connectionStatus="connected" typeCount={typeCount} />,
    );
    expect(screen.queryByText('UTF-8')).toBeNull();
  });

  it('does not show the GraphQL language label', () => {
    render(
      <StatusBarView connectionStatus="connected" typeCount={typeCount} />,
    );
    expect(screen.queryByText('GraphQL')).toBeNull();
  });

  it('renders as a footer with role contentinfo', () => {
    render(<StatusBarView connectionStatus="idle" typeCount={0} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
