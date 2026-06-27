'use no memo';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButton } from './';

vi.mock('../provider', () => ({
  useGraphiQL: vi.fn(),
  useGraphiQLActions: vi.fn(),
}));

import { useGraphiQL, useGraphiQLActions } from '../provider';

const mockUseGraphiQL = vi.mocked(useGraphiQL);
const mockUseGraphiQLActions = vi.mocked(useGraphiQLActions);
const run = vi.fn();
const stop = vi.fn();
const setOperationName = vi.fn();

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

type State = {
  operations?: OperationDefinitionNode[];
  operationName?: string | null;
  isFetching?: boolean;
  overrideOperationName?: string | null;
  subscription?: unknown;
  transportMethod?: 'GET' | 'POST' | null;
};

function setup(state: State) {
  mockUseGraphiQL.mockImplementation((selector: (s: any) => any) =>
    selector({
      operations: state.operations ?? [],
      operationName: state.operationName ?? null,
      isFetching: state.isFetching ?? false,
      overrideOperationName: state.overrideOperationName ?? null,
      subscription: state.subscription ?? null,
      transportMethod: state.transportMethod ?? null,
    }),
  );
  mockUseGraphiQLActions.mockReturnValue({
    run,
    stop,
    setOperationName,
  } as any);
}

const renderButton = (ui: ReactNode) => render(<T.Provider>{ui}</T.Provider>);

describe('ExecuteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables the button for a single mutation while GET is selected', () => {
    setup({ operations: opsOf('mutation M { a }'), transportMethod: 'GET' });
    renderButton(<ExecuteButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('wraps the disabled button in a focusable tooltip target while GET is selected', () => {
    setup({ operations: opsOf('mutation M { a }'), transportMethod: 'GET' });
    renderButton(<ExecuteButton />);
    // A native disabled button emits no events, so the tooltip needs a
    // focusable wrapper to receive hover/focus and open.
    const target = screen
      .getByRole('button')
      .closest('.graphiql-execute-button-tooltip-target');
    expect(target).not.toBeNull();
    expect(target).toHaveAttribute('tabindex', '0');
  });

  it('does not wrap the button when not blocked', () => {
    setup({ operations: opsOf('query Q { a }'), transportMethod: 'GET' });
    renderButton(<ExecuteButton />);
    expect(
      screen
        .getByRole('button')
        .closest('.graphiql-execute-button-tooltip-target'),
    ).toBeNull();
  });

  it('enables the button for a single query while GET is selected', () => {
    setup({ operations: opsOf('query Q { a }'), transportMethod: 'GET' });
    renderButton(<ExecuteButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('enables the button for a single mutation while POST is selected', () => {
    setup({ operations: opsOf('mutation M { a }'), transportMethod: 'POST' });
    renderButton(<ExecuteButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('disables the mutation item but not the query item in the dropdown while GET is selected', async () => {
    const user = userEvent.setup();
    setup({
      operations: opsOf('query Q { a }\nmutation M { b }'),
      transportMethod: 'GET',
    });
    renderButton(<ExecuteButton />);
    await user.click(screen.getByRole('button'));
    const queryItem = await screen.findByRole('menuitem', { name: 'Q' });
    const mutationItem = screen.getByRole('menuitem', { name: 'M' });
    expect(queryItem).not.toHaveAttribute('data-disabled');
    expect(mutationItem).toHaveAttribute('data-disabled');
  });
});
