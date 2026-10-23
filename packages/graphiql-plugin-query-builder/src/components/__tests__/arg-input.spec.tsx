import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { ArgInput, rendersAsInputObject } from '../arg-input';

const EpisodeEnum = new GraphQLEnumType({
  name: 'Episode',
  values: { NEWHOPE: { value: 4 }, EMPIRE: { value: 5 }, JEDI: { value: 6 } },
});

function intArg(name = 'count') {
  return {
    name,
    type: GraphQLInt,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

function floatArg(name = 'ratio') {
  return {
    name,
    type: GraphQLFloat,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

function stringArg(name = 'query') {
  return {
    name,
    type: GraphQLString,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

function boolArg(name = 'flag') {
  return {
    name,
    type: GraphQLBoolean,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

function enumArg(name = 'episode') {
  return {
    name,
    type: EpisodeEnum,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

function nonNullStringArg(name = 'id') {
  return {
    name,
    type: new GraphQLNonNull(GraphQLString),
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

describe('ArgInput — enum', () => {
  it('renders a select with all enum values', () => {
    render(<ArgInput arg={enumArg()} value="" onChange={() => {}} />);
    expect(
      screen.getByRole('combobox', { name: 'episode' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'NEWHOPE' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'EMPIRE' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'JEDI' })).toBeInTheDocument();
  });

  it('shows the empty placeholder option', () => {
    render(<ArgInput arg={enumArg()} value="" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: '—' })).toBeInTheDocument();
  });

  it('calls onChange when a value is selected', async () => {
    const onChange = vi.fn();
    render(<ArgInput arg={enumArg()} value="" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'JEDI');
    expect(onChange).toHaveBeenCalledWith('JEDI');
  });

  it('reflects the current value', () => {
    render(<ArgInput arg={enumArg()} value="EMPIRE" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('EMPIRE');
  });
});

describe('ArgInput — Int/Float', () => {
  it('renders a number input for Int', () => {
    render(<ArgInput arg={intArg()} value="" onChange={() => {}} />);
    expect(
      screen.getByRole('spinbutton', { name: 'count' }),
    ).toBeInTheDocument();
  });

  it('renders a number input for Float', () => {
    render(<ArgInput arg={floatArg()} value="" onChange={() => {}} />);
    expect(
      screen.getByRole('spinbutton', { name: 'ratio' }),
    ).toBeInTheDocument();
  });

  it('calls onChange when the value changes', async () => {
    const onChange = vi.fn();
    render(<ArgInput arg={intArg()} value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('spinbutton'), '42');
    expect(onChange).toHaveBeenCalled();
  });

  it('restricts the Int input to whole-number steps', () => {
    render(<ArgInput arg={intArg()} value="" onChange={() => {}} />);
    expect(screen.getByRole('spinbutton', { name: 'count' })).toHaveAttribute(
      'step',
      '1',
    );
  });

  it('does not constrain the Float input step', () => {
    render(<ArgInput arg={floatArg()} value="" onChange={() => {}} />);
    expect(
      screen.getByRole('spinbutton', { name: 'ratio' }),
    ).not.toHaveAttribute('step');
  });
});

describe('ArgInput — String/ID', () => {
  it('renders a text input for String', () => {
    render(<ArgInput arg={stringArg()} value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'query' })).toBeInTheDocument();
  });

  it('renders a text input for NonNull String', () => {
    render(<ArgInput arg={nonNullStringArg()} value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'id' })).toBeInTheDocument();
  });

  it('calls onChange on input', async () => {
    const onChange = vi.fn();
    render(<ArgInput arg={stringArg()} value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'Luke');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('ArgInput — Boolean', () => {
  it('renders a checkbox for Boolean', () => {
    render(<ArgInput arg={boolArg()} value="false" onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'flag' })).toBeInTheDocument();
  });

  it('is checked when value is "true"', () => {
    render(<ArgInput arg={boolArg()} value="true" onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('is unchecked when value is "false"', () => {
    render(<ArgInput arg={boolArg()} value="false" onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onChange with "true" when checked', async () => {
    const onChange = vi.fn();
    render(<ArgInput arg={boolArg()} value="false" onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith('true');
  });
});

describe('rendersAsInputObject', () => {
  const Input = new GraphQLInputObjectType({
    name: 'Filter',
    fields: { name: { type: GraphQLString } },
  });

  it('is true for an input object (also through NonNull)', () => {
    expect(rendersAsInputObject(Input)).toBe(true);
    expect(rendersAsInputObject(new GraphQLNonNull(Input))).toBe(true);
  });

  it('is false for a LIST of input objects (renders as a list, keeps its label)', () => {
    expect(rendersAsInputObject(new GraphQLList(Input))).toBe(false);
    expect(
      rendersAsInputObject(new GraphQLNonNull(new GraphQLList(Input))),
    ).toBe(false);
  });

  it('is false for scalars and scalar lists', () => {
    expect(rendersAsInputObject(GraphQLString)).toBe(false);
    expect(rendersAsInputObject(new GraphQLList(GraphQLInt))).toBe(false);
  });
});
