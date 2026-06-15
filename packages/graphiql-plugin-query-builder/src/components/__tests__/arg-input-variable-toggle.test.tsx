import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLInt, GraphQLString } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { ArgInput } from '../arg-input';

function makeArg(name: string, type: typeof GraphQLInt | typeof GraphQLString) {
  return {
    name,
    type,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

describe('ArgInput — variable toggle', () => {
  it('renders a "Use as variable" button when onPromote is supplied', () => {
    render(
      <ArgInput
        arg={makeArg('first', GraphQLInt)}
        value="5"
        onChange={() => {}}
        onPromote={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: /use as variable/i }),
    ).toBeInTheDocument();
  });

  it('does not render the toggle button when onPromote is not supplied', () => {
    render(
      <ArgInput arg={makeArg('first', GraphQLInt)} value="5" onChange={() => {}} />,
    );
    expect(
      screen.queryByRole('button', { name: /use as variable/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onPromote with the arg name when the toggle is clicked', async () => {
    const onPromote = vi.fn();
    render(
      <ArgInput
        arg={makeArg('first', GraphQLInt)}
        value="5"
        onChange={() => {}}
        onPromote={onPromote}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /use as variable/i }));
    expect(onPromote).toHaveBeenCalledWith('first', 'first');
  });

  it('shows the variable name when isVariable is true', () => {
    render(
      <ArgInput
        arg={makeArg('first', GraphQLInt)}
        value=""
        onChange={() => {}}
        isVariable
        variableName="first"
        onPromote={() => {}}
        onDemote={() => {}}
      />,
    );
    // Button should show $first
    expect(screen.getByRole('button', { name: /\$first/i })).toBeInTheDocument();
  });

  it('has aria-pressed=true on the toggle when isVariable is true', () => {
    render(
      <ArgInput
        arg={makeArg('first', GraphQLInt)}
        value=""
        onChange={() => {}}
        isVariable
        variableName="first"
        onPromote={() => {}}
        onDemote={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /\$first/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('has aria-pressed=false on the toggle when isVariable is false', () => {
    render(
      <ArgInput
        arg={makeArg('first', GraphQLInt)}
        value="5"
        onChange={() => {}}
        onPromote={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /use as variable/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onDemote with the variable name when active toggle is clicked', async () => {
    const onDemote = vi.fn();
    render(
      <ArgInput
        arg={makeArg('first', GraphQLInt)}
        value=""
        onChange={() => {}}
        isVariable
        variableName="first"
        onPromote={() => {}}
        onDemote={onDemote}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /\$first/i }));
    expect(onDemote).toHaveBeenCalledWith('first');
  });

  it('hides the literal input and shows a variable badge when isVariable is true', () => {
    render(
      <ArgInput
        arg={makeArg('query', GraphQLString)}
        value=""
        onChange={() => {}}
        isVariable
        variableName="query"
        onPromote={() => {}}
        onDemote={() => {}}
      />,
    );
    // The textbox for string input should not be visible
    expect(screen.queryByRole('textbox', { name: 'query' })).not.toBeInTheDocument();
    // A variable badge should be present (the span with class graphiql-qb-var-badge)
    expect(
      document.querySelector('.graphiql-qb-var-badge'),
    ).toBeInTheDocument();
  });
});
