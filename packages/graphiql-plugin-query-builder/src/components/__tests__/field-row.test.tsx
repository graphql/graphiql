import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { FieldRow } from '../field-row';

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

const nameField = parentType.getFields()['name']!;
const friendsField = parentType.getFields()['friends']!;

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
