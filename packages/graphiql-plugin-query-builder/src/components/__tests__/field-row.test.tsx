import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { FieldRow } from '../field-row';

const EpisodeEnum = new GraphQLEnumType({
  name: 'Episode',
  values: { NEWHOPE: { value: 4 }, JEDI: { value: 6 } },
});

const parentType = new GraphQLObjectType({
  name: 'Hero',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    friends: {
      type: new GraphQLObjectType({ name: 'Friend', fields: { id: { type: GraphQLString } } }),
    },
  },
});

const fieldWithArgs = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hero: {
      type: GraphQLString,
      args: {
        id: { type: GraphQLInt },
        episode: { type: EpisodeEnum },
      },
    },
  },
});

const nameField = parentType.getFields()['name']!;
const friendsField = parentType.getFields()['friends']!;
const heroField = fieldWithArgs.getFields()['hero']!;

describe('FieldRow', () => {
  it('renders the field name', () => {
    render(
      <FieldRow
        field={nameField}
        path={['hero']}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('renders the field type', () => {
    render(
      <FieldRow
        field={nameField}
        path={['hero']}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    expect(screen.getByText('String')).toBeInTheDocument();
  });

  it('checkbox is unchecked when selected=false', () => {
    render(
      <FieldRow
        field={nameField}
        path={['hero']}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: /Toggle name/i });
    expect(checkbox).not.toBeChecked();
  });

  it('checkbox is checked when selected=true', () => {
    render(
      <FieldRow
        field={nameField}
        path={['hero']}
        selected={true}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: /Toggle name/i });
    expect(checkbox).toBeChecked();
  });

  it('calls onToggle with the full path when checkbox is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <FieldRow
        field={nameField}
        path={['hero']}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={onToggle}
        onExpand={() => undefined}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: /Toggle name/i }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith(['hero', 'name']);
  });

  it('shows expand button for object fields', () => {
    render(
      <FieldRow
        field={friendsField}
        path={[]}
        selected={false}
        hasChildren={true}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    const expandBtn = screen.getByRole('button', { name: /Expand friends/i });
    expect(expandBtn).toBeInTheDocument();
  });

  it('calls onExpand when expand button is clicked', async () => {
    const onExpand = vi.fn();
    render(
      <FieldRow
        field={friendsField}
        path={[]}
        selected={false}
        hasChildren={true}
        expanded={false}
        onToggle={() => undefined}
        onExpand={onExpand}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Expand friends/i }));
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('does not show expand button for scalar fields', () => {
    render(
      <FieldRow
        field={nameField}
        path={[]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('applies indent based on path depth', () => {
    const { container } = render(
      <FieldRow
        field={nameField}
        path={['hero', 'friends']}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    const row = container.querySelector('.graphiql-qb-field-row') as HTMLElement;
    expect(row.style.paddingLeft).toBe('24px'); // 2 * 12px
  });
});

describe('FieldRow — arg inputs', () => {
  it('does not render arg inputs when field is not selected', () => {
    render(
      <FieldRow
        field={heroField}
        path={[]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders arg inputs when the field is selected', () => {
    render(
      <FieldRow
        field={heroField}
        path={[]}
        selected={true}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    expect(screen.getByRole('spinbutton', { name: 'id' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'episode' })).toBeInTheDocument();
  });

  it('pre-fills arg inputs from argValues', () => {
    render(
      <FieldRow
        field={heroField}
        path={[]}
        selected={true}
        hasChildren={false}
        expanded={false}
        argValues={{ id: '7', episode: 'JEDI' }}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />,
    );
    expect(screen.getByRole('spinbutton')).toHaveValue(7);
    expect(screen.getByRole('combobox')).toHaveValue('JEDI');
  });

  it('calls onSetArg when an arg input changes', async () => {
    const onSetArg = vi.fn();
    render(
      <FieldRow
        field={heroField}
        path={[]}
        selected={true}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
        onSetArg={onSetArg}
      />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'episode' }), 'NEWHOPE');
    expect(onSetArg).toHaveBeenCalledWith(['hero'], 'episode', 'NEWHOPE');
  });
});
