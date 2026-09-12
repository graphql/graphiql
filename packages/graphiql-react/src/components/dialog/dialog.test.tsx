import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Dialog } from './';
import { PortalProvider } from '../portal';

afterEach(cleanup);

describe('Dialog — portal container', () => {
  it('portals to document.body when no PortalProvider is present', () => {
    render(
      <Dialog open>
        <Dialog.Header>Title</Dialog.Header>
      </Dialog>,
    );
    const dialog = document.querySelector('.graphiql-dialog');
    expect(dialog).toBeInTheDocument();
    // Falls back to body — not nested under a GraphiQL container.
    expect(dialog?.closest('.graphiql-container')).toBeNull();
  });

  it('renders inside the container provided by PortalProvider', () => {
    const container = document.createElement('div');
    container.className = 'graphiql-container';
    container.setAttribute('data-density', 'compact');
    document.body.append(container);

    render(
      <PortalProvider container={container}>
        <Dialog open>
          <Dialog.Header>Title</Dialog.Header>
        </Dialog>
      </PortalProvider>,
    );

    const dialog = document.querySelector('.graphiql-dialog');
    expect(dialog).toBeInTheDocument();
    // The whole point: portaled content lives inside the container, so it
    // inherits its data-density / data-font-size / data-theme tokens.
    expect(container.contains(dialog!)).toBe(true);

    container.remove();
  });
});
