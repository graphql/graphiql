'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButtonView } from './';

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

describe('ExecuteButtonView', () => {
  it.each(['query', 'mutation', 'subscription'])(
    'uses operation-neutral labels for a %s',
    kind => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={opsOf(`${kind} Selected { field }`)}
        />,
      );
      expect(
        screen.getByRole('button', { name: 'Run operation' }),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Run operation shortcut'),
      ).toBeInTheDocument();
    },
  );

  it('calls onRun when the Run button is clicked', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<ExecuteButtonView {...DEFAULTS} onRun={onRun} />);
    await user.click(screen.getByRole('button', { name: /Run operation/i }));
    expect(onRun).toHaveBeenCalled();
  });

  it('runs the selected mutation with the primary button', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(
      <ExecuteButtonView
        {...DEFAULTS}
        operations={opsOf('mutation Change { update }')}
        operationName="Change"
        onRun={onRun}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Run operation' }));
    expect(onRun).toHaveBeenCalledOnce();
  });

  describe('stop', () => {
    it('becomes a Stop button while fetching', () => {
      render(<ExecuteButtonView {...DEFAULTS} isFetching />);
      expect(
        screen.getByRole('button', { name: /Stop operation/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Run operation/i }),
      ).not.toBeInTheDocument();
    });

    it('becomes a Stop button while subscribed', () => {
      render(<ExecuteButtonView {...DEFAULTS} isSubscribed />);
      expect(
        screen.getByRole('button', { name: /Stop operation/i }),
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
      await user.click(screen.getByRole('button', { name: /Stop operation/i }));
      expect(onStop).toHaveBeenCalled();
      expect(onRun).not.toHaveBeenCalled();
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

    it('selects and runs a mutation from the operation picker', async () => {
      const user = userEvent.setup();
      const onRun = vi.fn();
      const onSetOperationName = vi.fn();
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={opsOf('query Q { a }\nmutation M { b }')}
          operationName="Q"
          onRun={onRun}
          onSetOperationName={onSetOperationName}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      );
      await user.click(await screen.findByRole('menuitem', { name: 'M' }));
      expect(onSetOperationName).toHaveBeenCalledWith('M');
      expect(onRun).toHaveBeenCalledOnce();
      expect(onSetOperationName.mock.invocationCallOrder[0]!).toBeLessThan(
        onRun.mock.invocationCallOrder[0]!,
      );
    });
  });
});
