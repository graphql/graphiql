'use no memo';

import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButtonView } from './';
import { Tooltip } from '../tooltip';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const DEFAULTS = {
  isFetching: false,
  onRun() {},
  onStop() {},
};

// The blocked state renders a Tooltip, which needs a provider ancestor.
const renderBlocked = (ui: ReactElement) =>
  render(<Tooltip.Provider>{ui}</Tooltip.Provider>);

describe('ExecuteButtonView', () => {
  it('renders the Run button', () => {
    render(<ExecuteButtonView {...DEFAULTS} />);
    expect(
      screen.getByRole('button', { name: /Run query/i }),
    ).toBeInTheDocument();
  });

  it('calls onRun when the Run button is clicked', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<ExecuteButtonView {...DEFAULTS} onRun={onRun} />);
    await user.click(screen.getByRole('button', { name: /Run query/i }));
    expect(onRun).toHaveBeenCalled();
  });

  it('disables the Run button when a mutation is blocked over GET', () => {
    renderBlocked(
      <ExecuteButtonView
        {...DEFAULTS}
        transportMethod="GET"
        runDisabledReason="Mutations can only be sent via POST"
      />,
    );
    expect(screen.getByRole('button', { name: /Run query/i })).toBeDisabled();
  });

  it('wraps the disabled Run button in a focusable tooltip target when blocked', () => {
    renderBlocked(
      <ExecuteButtonView
        {...DEFAULTS}
        transportMethod="GET"
        runDisabledReason="Mutations can only be sent via POST"
      />,
    );
    // A native disabled button emits no events, so the tooltip needs a
    // focusable wrapper to receive hover/focus and open.
    const target = screen
      .getByRole('button', { name: /Run query/i })
      .closest('.graphiql-execute-button-tooltip-target');
    expect(target).not.toBeNull();
    expect(target).toHaveAttribute('tabindex', '0');
  });

  it('does not disable or wrap the button when not blocked', () => {
    const { container } = render(<ExecuteButtonView {...DEFAULTS} />);
    expect(
      screen.getByRole('button', { name: /Run query/i }),
    ).not.toBeDisabled();
    expect(
      container.querySelector('.graphiql-execute-button-tooltip-target'),
    ).toBeNull();
  });

  describe('stop', () => {
    it('becomes a Stop button while fetching', () => {
      render(<ExecuteButtonView {...DEFAULTS} isFetching />);
      expect(
        screen.getByRole('button', { name: /Stop query/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Run query/i }),
      ).not.toBeInTheDocument();
    });

    it('becomes a Stop button while subscribed', () => {
      render(<ExecuteButtonView {...DEFAULTS} isSubscribed />);
      expect(
        screen.getByRole('button', { name: /Stop query/i }),
      ).toBeInTheDocument();
    });

    it('calls onStop, not onRun, when clicked while running', async () => {
      const user = userEvent.setup();
      const onRun = vi.fn();
      const onStop = vi.fn();
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          isFetching
          onRun={onRun}
          onStop={onStop}
        />,
      );
      await user.click(screen.getByRole('button', { name: /Stop query/i }));
      expect(onStop).toHaveBeenCalled();
      expect(onRun).not.toHaveBeenCalled();
    });

    it('leaves Stop enabled even when a run would be blocked', () => {
      renderBlocked(
        <ExecuteButtonView
          {...DEFAULTS}
          isFetching
          transportMethod="GET"
          runDisabledReason="Mutations can only be sent via POST"
        />,
      );
      expect(
        screen.getByRole('button', { name: /Stop query/i }),
      ).not.toBeDisabled();
    });

    it('hides the operation picker while running', () => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          isFetching
          operations={opsOf('query Alpha { a }\nquery Beta { b }')}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('operation picker', () => {
    const TWO_OPS = opsOf('query Alpha { a }\nquery Beta { b }');

    it('shows no caret with zero or one operation', () => {
      const { rerender } = render(
        <ExecuteButtonView {...DEFAULTS} operations={[]} />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();

      rerender(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={opsOf('query Alpha { a }')}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();
    });

    it('shows no caret when an operation name is pinned via overrideOperationName', () => {
      render(
        <ExecuteButtonView
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
      render(<ExecuteButtonView {...DEFAULTS} operations={TWO_OPS} />);
      expect(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      ).toBeInTheDocument();
    });

    it('lists every operation by name in the menu', async () => {
      const user = userEvent.setup();
      render(<ExecuteButtonView {...DEFAULTS} operations={TWO_OPS} />);
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
        <ExecuteButtonView
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
        <ExecuteButtonView
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
      render(
        <ExecuteButtonView
          {...DEFAULTS}
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
