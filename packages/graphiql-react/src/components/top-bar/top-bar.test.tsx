'use no memo';

import type { ReactElement } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parse, OperationDefinitionNode } from 'graphql';
import { TopBarView } from './';
import { Tooltip } from '../tooltip';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const DEFAULTS = {
  isFetching: false,
  url: 'https://api.example.com/graphql',
  method: 'POST' as const,
  supportedMethods: ['POST' as const],
  onRun() {},
  onSetMethod(_method: HttpMethod) {},
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

  it('cycles to the next method when three are supported (POST → QUERY)', async () => {
    const user = userEvent.setup();
    const onSetMethod = vi.fn();
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="POST"
        supportedMethods={['GET', 'POST', 'QUERY']}
        onSetMethod={onSetMethod}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'POST' }));
    expect(onSetMethod).toHaveBeenCalledWith('QUERY');
  });

  it('cycles past the last method back to the first (QUERY → GET)', async () => {
    const user = userEvent.setup();
    const onSetMethod = vi.fn();
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="QUERY"
        supportedMethods={['GET', 'POST', 'QUERY']}
        onSetMethod={onSetMethod}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'QUERY' }));
    expect(onSetMethod).toHaveBeenCalledWith('GET');
  });

  it('jumps straight to POST (not the next method) when a mutation is blocked over QUERY', async () => {
    const user = userEvent.setup();
    const onSetMethod = vi.fn();
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="QUERY"
        supportedMethods={['GET', 'POST', 'QUERY']}
        runDisabledReason="Mutations can only be sent via POST"
        onSetMethod={onSetMethod}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'QUERY' }));
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

  it('disables the Run button when a mutation is blocked over GET', () => {
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can only be sent via POST"
      />,
    );
    expect(screen.getByRole('button', { name: /Run query/i })).toBeDisabled();
  });

  it('highlights the method toggle when a mutation is blocked over GET', () => {
    const { container } = renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can only be sent via POST"
      />,
    );
    expect(
      container.querySelector('.graphiql-top-bar-method-toggle--attention'),
    ).not.toBeNull();
  });

  it('wraps the disabled Run button in a focusable tooltip target when blocked', () => {
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can only be sent via POST"
      />,
    );
    // A native disabled button emits no events, so the tooltip needs a
    // focusable wrapper to receive hover/focus and open.
    const target = screen
      .getByRole('button', { name: /Run query/i })
      .closest('.graphiql-top-bar-run-tooltip-target');
    expect(target).not.toBeNull();
    expect(target).toHaveAttribute('tabindex', '0');
  });

  it('does not highlight the toggle, disable Run, or wrap it when not blocked', () => {
    const { container } = renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Run query/i }),
    ).not.toBeDisabled();
    expect(
      container.querySelector('.graphiql-top-bar-method-toggle--attention'),
    ).toBeNull();
    expect(
      container.querySelector('.graphiql-top-bar-run-tooltip-target'),
    ).toBeNull();
  });

  it('has role="banner" on the header element', () => {
    const { container } = render(<TopBarView {...DEFAULTS} />);
    expect(container.querySelector('header[role="banner"]')).not.toBeNull();
  });

  describe('operation picker', () => {
    const TWO_OPS = opsOf('query Alpha { a }\nquery Beta { b }');

    it('shows no caret with zero or one operation', () => {
      const { rerender } = render(<TopBarView {...DEFAULTS} operations={[]} />);
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();

      rerender(
        <TopBarView {...DEFAULTS} operations={opsOf('query Alpha { a }')} />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();
    });

    it('shows no caret when an operation name is pinned via overrideOperationName', () => {
      render(
        <TopBarView
          {...DEFAULTS}
          operations={TWO_OPS}
          overrideOperationName="Alpha"
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();
    });

    it('shows a caret with more than one operation', () => {
      render(<TopBarView {...DEFAULTS} operations={TWO_OPS} />);
      expect(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      ).toBeInTheDocument();
    });

    it('lists every operation by name in the menu', async () => {
      const user = userEvent.setup();
      render(<TopBarView {...DEFAULTS} operations={TWO_OPS} />);
      await user.click(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      );
      expect(
        await screen.findByRole('menuitem', { name: 'Alpha' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Beta' }),
      ).toBeInTheDocument();
    });

    it('sets the operation name and runs when picking an operation', async () => {
      const user = userEvent.setup();
      const onRun = vi.fn();
      const onSetOperationName = vi.fn();
      render(
        <TopBarView
          {...DEFAULTS}
          operations={TWO_OPS}
          operationName="Alpha"
          onRun={onRun}
          onSetOperationName={onSetOperationName}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      );
      await user.click(await screen.findByRole('menuitem', { name: 'Beta' }));
      expect(onSetOperationName).toHaveBeenCalledWith('Beta');
      expect(onRun).toHaveBeenCalled();
    });

    it('does not call setOperationName when picking the already-active operation', async () => {
      const user = userEvent.setup();
      const onRun = vi.fn();
      const onSetOperationName = vi.fn();
      render(
        <TopBarView
          {...DEFAULTS}
          operations={TWO_OPS}
          operationName="Alpha"
          onRun={onRun}
          onSetOperationName={onSetOperationName}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      );
      await user.click(await screen.findByRole('menuitem', { name: 'Alpha' }));
      expect(onSetOperationName).not.toHaveBeenCalled();
      expect(onRun).toHaveBeenCalled();
    });

    it('disables a menu item whose operation is blocked for the current method', async () => {
      const user = userEvent.setup();
      const ops = opsOf('query Q { a }\nmutation M { b }');
      renderTopBar(
        <TopBarView
          {...DEFAULTS}
          method="GET"
          supportedMethods={['GET', 'POST']}
          transportMethod="GET"
          operations={ops}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      );
      const queryItem = await screen.findByRole('menuitem', { name: 'Q' });
      const mutationItem = screen.getByRole('menuitem', { name: 'M' });
      expect(queryItem).not.toHaveAttribute('data-disabled');
      expect(mutationItem).toHaveAttribute('data-disabled');
    });
  });
});
