import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '@graphiql/react';
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { fieldSegment } from '../../lib/document-mutator';
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
      type: new GraphQLObjectType({
        name: 'Friend',
        fields: { id: { type: GraphQLString } },
      }),
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

const typeWithEnumReturn = new GraphQLObjectType({
  name: 'WithEnumReturn',
  fields: {
    episode: { type: EpisodeEnum },
  },
});

const typeWithDeprecated = new GraphQLObjectType({
  name: 'WithDeprecated',
  fields: {
    legacy: { type: GraphQLString, deprecationReason: 'Use name instead' },
    current: { type: GraphQLString },
  },
});

const nameField = parentType.getFields()['name']!;
const friendsField = parentType.getFields()['friends']!;
const heroField = fieldWithArgs.getFields()['hero']!;
const legacyField = typeWithDeprecated.getFields()['legacy']!;
const currentField = typeWithDeprecated.getFields()['current']!;
const episodeField = typeWithEnumReturn.getFields()['episode']!;

describe('FieldRow', () => {
  it('renders the field name', () => {
    render(
      <FieldRow
        field={nameField}
        path={[fieldSegment('hero')]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('renders the field type', () => {
    render(
      <FieldRow
        field={nameField}
        path={[fieldSegment('hero')]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    expect(screen.getByText('String')).toBeInTheDocument();
  });

  it('marks a scalar return type with the --scalar modifier', () => {
    const { container } = render(
      <FieldRow
        field={nameField}
        path={[fieldSegment('hero')]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    const typeEl = container.querySelector('.graphiql-qb-field-type');
    expect(typeEl?.className).toContain('graphiql-qb-field-type--scalar');
  });

  it('marks an enum return type with the --enum modifier', () => {
    const { container } = render(
      <FieldRow
        field={episodeField}
        path={[]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    const typeEl = container.querySelector('.graphiql-qb-field-type');
    expect(typeEl?.className).toContain('graphiql-qb-field-type--enum');
  });

  it('checkbox is unchecked when selected=false', () => {
    render(
      <FieldRow
        field={nameField}
        path={[fieldSegment('hero')]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: /Toggle name/i });
    expect(checkbox).not.toBeChecked();
  });

  it('checkbox is checked when selected=true', () => {
    render(
      <FieldRow
        field={nameField}
        path={[fieldSegment('hero')]}
        selected
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
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
        path={[fieldSegment('hero')]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={onToggle}
        onExpand={() => {}}
      />,
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: /Toggle name/i }),
    );
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith([
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
  });

  it('shows expand button for object fields', () => {
    render(
      <FieldRow
        field={friendsField}
        path={[]}
        selected={false}
        hasChildren
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
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
        hasChildren
        expanded={false}
        onToggle={() => {}}
        onExpand={onExpand}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Expand friends/i }),
    );
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
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not show a checkbox for composite fields (expand-only)', () => {
    render(
      <FieldRow
        field={friendsField}
        path={[]}
        selected={false}
        hasChildren
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(
      screen.getByRole('button', { name: /Expand friends/i }),
    ).toBeInTheDocument();
  });

  it('applies indent based on path depth', () => {
    const { container } = render(
      <FieldRow
        field={nameField}
        path={[fieldSegment('hero'), fieldSegment('friends')]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    const row = container.querySelector(
      '.graphiql-qb-field-row',
    ) as HTMLElement;
    expect(row.style.paddingLeft).toBe('24px'); // depth 2 × 12px
  });
});

describe('FieldRow — deprecated fields', () => {
  it('marks a deprecated field and surfaces the reason', async () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <FieldRow
          field={legacyField}
          path={[]}
          selected={false}
          hasChildren={false}
          expanded={false}
          onToggle={() => {}}
          onExpand={() => {}}
        />
      </Tooltip.Provider>,
    );
    const badge = screen.getByText('DEP');
    expect(badge).toHaveAttribute('aria-label', 'deprecated');
    expect(screen.getByText('legacy')).toHaveClass(
      'graphiql-qb-field-name--deprecated',
    );
    // Radix renders tooltip content both visibly and for screen readers, so >1 match.
    await userEvent.hover(badge);
    const tips = await screen.findAllByText('Use name instead');
    expect(tips.length).toBeGreaterThan(0);
  });

  it('does not mark a non-deprecated field', () => {
    render(
      <FieldRow
        field={currentField}
        path={[]}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    expect(screen.queryByText('DEP')).toBeNull();
    expect(screen.getByText('current')).not.toHaveClass(
      'graphiql-qb-field-name--deprecated',
    );
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
        onToggle={() => {}}
        onExpand={() => {}}
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
        selected
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
      />,
    );
    expect(screen.getByRole('spinbutton', { name: 'id' })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'episode' }),
    ).toBeInTheDocument();
  });

  it('pre-fills arg inputs from argValues', () => {
    render(
      <FieldRow
        field={heroField}
        path={[]}
        selected
        hasChildren={false}
        expanded={false}
        argValues={{ id: '7', episode: 'JEDI' }}
        onToggle={() => {}}
        onExpand={() => {}}
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
        selected
        hasChildren={false}
        expanded={false}
        onToggle={() => {}}
        onExpand={() => {}}
        onSetArg={onSetArg}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'episode' }),
      'NEWHOPE',
    );
    expect(onSetArg).toHaveBeenCalledWith(
      [fieldSegment('hero')],
      'episode',
      'NEWHOPE',
    );
  });
});
