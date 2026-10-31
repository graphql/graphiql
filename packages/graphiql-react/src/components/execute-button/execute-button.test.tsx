'use no memo';

import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render as renderReact, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButtonView } from './';
import { Tooltip } from '../tooltip';

function render(element: ReactElement) {
  return renderReact(element, {
    wrapper: ({ children }) => <Tooltip.Provider>{children}</Tooltip.Provider>,
  });
}

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
const TWO_OPS = opsOf('query Alpha { a }\nmutation Change { b }');
const QUERY_METHODS = {
  queryMethod: 'QUERY' as const,
  supportedMethods: ['QUERY', 'POST', 'GET'] as const,
  isMethodAutomatic: true,
};

describe('ExecuteButtonView', () => {
  it.each([
    ['query', 'QRY'],
    ['mutation', 'MUT'],
    ['subscription', 'SUB'],
  ])(
    'keeps the selected %s name visible with an operation-neutral Run action',
    (kind, chip) => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={opsOf(`${kind} Selected { field }`)}
        />,
      );
      expect(screen.getByText('Selected')).toBeVisible();
      expect(screen.getByText(chip)).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Run operation' }),
      ).toBeEnabled();
    },
  );

  it('labels an anonymous operation without inventing an operation name', () => {
    render(<ExecuteButtonView {...DEFAULTS} operations={opsOf('{ field }')} />);
    expect(screen.getByText('<Anonymous query>')).toBeVisible();
  });

  it('does not imply that an ambiguous document has a selected operation', () => {
    render(<ExecuteButtonView {...DEFAULTS} operations={TWO_OPS} />);
    expect(
      screen.getByRole('button', { name: 'Choose operation to run' }),
    ).toHaveTextContent('Choose operation');
  });

  it('runs only when the primary action is clicked', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<ExecuteButtonView {...DEFAULTS} onRun={onRun} />);
    await user.click(screen.getByRole('button', { name: 'Run operation' }));
    expect(onRun).toHaveBeenCalledOnce();
  });

  it('shows the keyboard shortcut in the Run tooltip', async () => {
    const user = userEvent.setup();
    render(<ExecuteButtonView {...DEFAULTS} />);
    await user.hover(screen.getByRole('button', { name: 'Run operation' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/Run/);
    expect(
      screen.getAllByLabelText('Run operation shortcut').length,
    ).toBeGreaterThan(0);
  });

  describe('stop', () => {
    it('keeps the executing query visible when the editor selects a mutation', () => {
      const props = {
        ...DEFAULTS,
        ...QUERY_METHODS,
        operations: TWO_OPS,
        operationName: 'Change',
        executingOperation: TWO_OPS[0],
        onSetMethod: vi.fn(),
      };
      const { rerender } = render(<ExecuteButtonView {...props} isFetching />);
      expect(
        screen.getByRole('button', { name: 'Stop operation' }),
      ).toBeEnabled();
      expect(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      ).toHaveTextContent('Alpha');
      expect(
        screen.getByRole('button', { name: 'Choose request method' }),
      ).toHaveTextContent('QUERY');
      expect(screen.queryByText('POST')).not.toBeInTheDocument();
      rerender(<ExecuteButtonView {...props} />);
      expect(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      ).toHaveTextContent('Change');
      expect(screen.getByText('POST')).toBeVisible();
    });

    it.each([{ isFetching: true }, { isSubscribed: true }])(
      'keeps Stop available while running (%j)',
      running => {
        render(<ExecuteButtonView {...DEFAULTS} {...running} />);
        expect(
          screen.getByRole('button', { name: 'Stop operation' }),
        ).toBeEnabled();
        expect(
          screen.queryByRole('button', { name: 'Run operation' }),
        ).not.toBeInTheDocument();
      },
    );

    it('stops without running and keeps the selected operation visible', async () => {
      const user = userEvent.setup();
      const onRun = vi.fn();
      const onStop = vi.fn();
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          {...QUERY_METHODS}
          isFetching
          operations={TWO_OPS}
          operationName="Alpha"
          onRun={onRun}
          onStop={onStop}
          onSetMethod={vi.fn()}
        />,
      );
      expect(screen.getByText('Alpha')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Choose operation to run' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Choose request method' }),
      ).toBeDisabled();
      await user.click(screen.getByRole('button', { name: 'Stop operation' }));
      expect(onStop).toHaveBeenCalledOnce();
      expect(onRun).not.toHaveBeenCalled();
    });
  });

  describe('operation picker', () => {
    it('keeps a single operation visible without offering a picker', () => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={opsOf('query Alpha { a }')}
        />,
      );
      expect(screen.getByText('Alpha')).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Choose operation to run' }),
      ).not.toBeInTheDocument();
    });

    it('selects a mutation without executing it', async () => {
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
      expect(
        await screen.findByRole('menuitemradio', { name: /QRY.*Alpha/ }),
      ).toBeVisible();
      await user.click(
        screen.getByRole('menuitemradio', { name: /MUT.*Change/ }),
      );
      expect(onSetOperationName).toHaveBeenCalledExactlyOnceWith('Change');
      expect(onRun).not.toHaveBeenCalled();
    });

    it('does nothing when picking the already-active operation', async () => {
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
      await user.click(
        await screen.findByRole('menuitemradio', { name: /QRY.*Alpha/ }),
      );
      expect(onSetOperationName).not.toHaveBeenCalled();
      expect(onRun).not.toHaveBeenCalled();
    });

    it('supports keyboard selection and restores focus to the operation control', async () => {
      const user = userEvent.setup();
      const onSetOperationName = vi.fn();
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={TWO_OPS}
          operationName="Alpha"
          onSetOperationName={onSetOperationName}
        />,
      );
      const picker = screen.getByRole('button', {
        name: 'Choose operation to run',
      });
      picker.focus();
      await user.keyboard('{Enter}');
      expect(
        await screen.findByRole('menuitemradio', { name: /QRY.*Alpha/ }),
      ).toHaveFocus();
      await user.keyboard('c');
      expect(
        screen.getByRole('menuitemradio', { name: /MUT.*Change/ }),
      ).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onSetOperationName).toHaveBeenCalledWith('Change');
      expect(picker).toHaveFocus();
    });
  });

  describe('request method', () => {
    it('does not guess a method before an operation is selected', () => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          {...QUERY_METHODS}
          operations={TWO_OPS}
          onSetMethod={vi.fn()}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose request method' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('QUERY')).not.toBeInTheDocument();
      expect(screen.queryByText('POST')).not.toBeInTheDocument();
    });

    it('shows only the effective method until the menu opens', async () => {
      const user = userEvent.setup();
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          {...QUERY_METHODS}
          operations={TWO_OPS}
          operationName="Alpha"
          onSetMethod={vi.fn()}
        />,
      );
      const picker = screen.getByRole('button', {
        name: 'Choose request method',
      });
      expect(picker).toHaveTextContent('QUERY');
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
      await user.click(picker);
      expect(
        await screen.findByRole('menuitemradio', { name: 'Auto' }),
      ).toHaveAttribute('aria-checked', 'true');
    });

    it.each([['POST'], ['POST', 'POST']] as const)(
      'explains unavailable methods even with one distinct method (%j)',
      async (...supportedMethods) => {
        const user = userEvent.setup();
        const onSetMethod = vi.fn();
        render(
          <ExecuteButtonView
            {...DEFAULTS}
            queryMethod="POST"
            supportedMethods={supportedMethods}
            operations={TWO_OPS}
            operationName="Alpha"
            isMethodAutomatic
            onSetMethod={onSetMethod}
          />,
        );
        await user.click(
          screen.getByRole('button', { name: 'Choose request method' }),
        );
        expect(
          screen.getAllByRole('menuitemradio', { name: 'POST' }),
        ).toHaveLength(1);
        const unavailable = screen.getByRole('menuitemradio', {
          name: 'QUERY',
        });
        expect(unavailable).toHaveAttribute('aria-disabled', 'true');
        await user.hover(unavailable);
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
          'This server does not support QUERY.',
        );
        await user.click(unavailable);
        expect(onSetMethod).not.toHaveBeenCalled();
        expect(screen.getByRole('menu')).toBeVisible();
        await user.keyboard('{Home}{ArrowDown}');
        expect(unavailable).toHaveFocus();
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
          'This server does not support QUERY.',
        );
        await user.keyboard('{Enter}');
        expect(onSetMethod).not.toHaveBeenCalled();
        expect(screen.getByRole('menu')).toBeVisible();
        expect(
          screen.getByRole('menuitemradio', { name: 'GET' }),
        ).toHaveAttribute('aria-disabled', 'true');
      },
    );

    it('disables unsupported methods and can restore automatic selection', async () => {
      const user = userEvent.setup();
      const onSetMethod = vi.fn();
      const onRun = vi.fn();
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          queryMethod="GET"
          methodOverride="GET"
          supportedMethods={['POST', 'GET', 'GET']}
          operations={TWO_OPS}
          operationName="Alpha"
          onSetMethod={onSetMethod}
          onRun={onRun}
        />,
      );
      const picker = screen.getByRole('button', {
        name: 'Choose request method',
      });
      expect(within(picker).queryByText('Auto')).not.toBeInTheDocument();
      await user.click(picker);
      expect(
        await screen.findByRole('menuitemradio', { name: /^Auto/ }),
      ).toBeVisible();
      expect(
        screen.getAllByRole('menuitemradio', { name: 'GET' }),
      ).toHaveLength(1);
      expect(
        screen.getByRole('menuitemradio', { name: 'QUERY' }),
      ).toHaveAttribute('aria-disabled', 'true');
      await user.click(screen.getByRole('menuitemradio', { name: 'POST' }));
      expect(onSetMethod).toHaveBeenLastCalledWith('POST');
      await user.click(picker);
      await user.click(
        await screen.findByRole('menuitemradio', { name: /^Auto/ }),
      );
      expect(onSetMethod).toHaveBeenCalledTimes(2);
      expect(onSetMethod.mock.calls.at(-1)?.[0]).toBeUndefined();
      expect(onRun).not.toHaveBeenCalled();
    });

    it('explains mutation restrictions without changing the query override', async () => {
      const user = userEvent.setup();
      const props = {
        ...DEFAULTS,
        ...QUERY_METHODS,
        operations: TWO_OPS,
        queryMethod: 'GET' as const,
        methodOverride: 'GET' as const,
        isMethodAutomatic: false,
        onSetMethod: vi.fn(),
      };
      const { rerender } = render(
        <ExecuteButtonView {...props} operationName="Alpha" />,
      );
      expect(
        screen.getByRole('button', { name: 'Choose request method' }),
      ).toHaveTextContent('GET');
      rerender(<ExecuteButtonView {...props} operationName="Change" />);
      const picker = screen.getByRole('button', {
        name: 'Choose request method',
      });
      expect(picker).toHaveTextContent('POST');
      await user.click(picker);
      expect(
        screen.queryByRole('menuitemradio', { name: 'Auto' }),
      ).not.toBeInTheDocument();
      for (const method of ['GET', 'QUERY']) {
        const unavailable = screen.getByRole('menuitemradio', { name: method });
        expect(unavailable).toHaveAttribute('aria-disabled', 'true');
        await user.hover(unavailable);
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
          `${method} is not supported for mutations.`,
        );
        await user.click(unavailable);
        expect(props.onSetMethod).not.toHaveBeenCalled();
      }
      await user.click(screen.getByRole('menuitemradio', { name: 'POST' }));
      rerender(<ExecuteButtonView {...props} operationName="Alpha" />);
      expect(
        screen.getByRole('button', { name: 'Choose request method' }),
      ).toHaveTextContent('GET');
      expect(props.onSetMethod).not.toHaveBeenCalled();
    });

    it('hides the HTTP method for subscriptions', () => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          {...QUERY_METHODS}
          operations={opsOf('subscription Events { event }')}
          onSetMethod={vi.fn()}
        />,
      );
      expect(screen.queryByText('QUERY')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Choose request method' }),
      ).not.toBeInTheDocument();
    });

    it('does not invent a method for a legacy fetcher', () => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          operations={TWO_OPS}
          operationName="Alpha"
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Choose request method' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('POST')).not.toBeInTheDocument();
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    });

    it('shows a read-only method for a transport without a setter', () => {
      render(
        <ExecuteButtonView
          {...DEFAULTS}
          queryMethod="GET"
          supportedMethods={['GET']}
          operations={TWO_OPS}
          operationName="Alpha"
        />,
      );
      expect(screen.getByText('GET')).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Choose request method' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    });
  });
});
