import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { ArgInput } from '../arg-input';
import type { ArgValue } from '../../lib/document-mutator';

// ---------------------------------------------------------------------------
// Shared input types
// ---------------------------------------------------------------------------

const TagInput = new GraphQLInputObjectType({
  name: 'TagInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    value: { type: GraphQLString },
  },
});

function makeArg(name: string, type: unknown) {
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

// ---------------------------------------------------------------------------
// ArgInput — list of scalars
// ---------------------------------------------------------------------------

describe('ArgInput — list of scalars', () => {
  it('renders an "Add item" button for a list arg', () => {
    const arg = makeArg('tags', new GraphQLList(GraphQLString));
    render(<ArgInput arg={arg} value={[]} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  it('renders one input per existing item', () => {
    const arg = makeArg('ids', new GraphQLList(GraphQLString));
    render(<ArgInput arg={arg} value={['alpha', 'beta']} onChange={() => {}} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
  });

  it('calls onChange with updated list when user types in an item', async () => {
    const arg = makeArg('tags', new GraphQLList(GraphQLString));
    const onChange = vi.fn();
    render(<ArgInput arg={arg} value={['']} onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'x');
    expect(onChange).toHaveBeenCalled();
    // Each onChange call should pass the whole list as an ArgValue array
    const firstCall = onChange.mock.calls[0][0] as ArgValue;
    expect(Array.isArray(firstCall)).toBe(true);
    expect((firstCall as ArgValue[])[0]).toBe('x');
  });

  it('adds a new empty item when "Add item" is clicked', async () => {
    const arg = makeArg('tags', new GraphQLList(GraphQLString));
    const onChange = vi.fn();
    render(<ArgInput arg={arg} value={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(onChange).toHaveBeenCalled();
    const result = onChange.mock.calls[0][0] as ArgValue[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('removes an item when the remove button is clicked', async () => {
    const arg = makeArg('tags', new GraphQLList(GraphQLString));
    const onChange = vi.fn();
    render(<ArgInput arg={arg} value={['a', 'b']} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove item/i });
    await userEvent.click(removeButtons[0]!);
    expect(onChange).toHaveBeenCalled();
    const result = onChange.mock.calls[0][0] as ArgValue[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('b');
  });

  it('renders a list wrapped in NonNull', () => {
    const arg = makeArg('ids', new GraphQLNonNull(new GraphQLList(GraphQLString)));
    render(<ArgInput arg={arg} value={[]} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ArgInput — list of integers
// ---------------------------------------------------------------------------

describe('ArgInput — list of Int', () => {
  it('renders number inputs for items in a list of Int', () => {
    const arg = makeArg('ids', new GraphQLList(GraphQLInt));
    render(<ArgInput arg={arg} value={['1', '2']} onChange={() => {}} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// ArgInput — input object
// ---------------------------------------------------------------------------

describe('ArgInput — input object', () => {
  it('renders a disclosure element for the input object', () => {
    const arg = makeArg('input', TagInput);
    render(<ArgInput arg={arg} value={{}} onChange={() => {}} />);
    // Should render a <details> with a <summary>
    const details = document.querySelector('details.graphiql-qb-input-object');
    expect(details).toBeInTheDocument();
  });

  it('renders each field of the input object', () => {
    const arg = makeArg('input', TagInput);
    render(<ArgInput arg={arg} value={{}} onChange={() => {}} />);
    // TagInput has fields: name, value
    expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'value' })).toBeInTheDocument();
  });

  it('calls onChange with updated object when a field changes', async () => {
    const arg = makeArg('input', TagInput);
    const onChange = vi.fn();
    render(<ArgInput arg={arg} value={{}} onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'name' }), 'x');
    expect(onChange).toHaveBeenCalled();
    // Each call should pass the whole input object as an ArgValue object
    const firstVal = onChange.mock.calls[0][0] as { [field: string]: ArgValue };
    expect(typeof firstVal).toBe('object');
    expect(!Array.isArray(firstVal)).toBe(true);
    expect(firstVal['name']).toBe('x');
  });

  it('reflects existing field values', () => {
    const arg = makeArg('input', TagInput);
    render(
      <ArgInput
        arg={arg}
        value={{ name: 'hello', value: 'world' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('hello');
    expect(screen.getByRole('textbox', { name: 'value' })).toHaveValue('world');
  });
});

// ---------------------------------------------------------------------------
// ArgInput — list of input objects
// ---------------------------------------------------------------------------

describe('ArgInput — list of input objects', () => {
  it('renders inputs for each item in a list of input objects', () => {
    const arg = makeArg('tags', new GraphQLList(TagInput));
    const value: ArgValue[] = [{ name: 'a', value: '1' }, { name: 'b', value: '2' }];
    render(<ArgInput arg={arg} value={value} onChange={() => {}} />);
    const nameInputs = screen.getAllByRole('textbox', { name: 'name' });
    expect(nameInputs).toHaveLength(2);
  });

  it('adds a new object item when "Add item" is clicked', async () => {
    const arg = makeArg('tags', new GraphQLList(TagInput));
    const onChange = vi.fn();
    render(<ArgInput arg={arg} value={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(onChange).toHaveBeenCalled();
    const result = onChange.mock.calls[0][0] as ArgValue[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });
});
