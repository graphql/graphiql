import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  parse,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { FieldTree } from '../field-tree';

// ---------------------------------------------------------------------------
// Mini schema with a union field
// ---------------------------------------------------------------------------

const HumanType = new GraphQLObjectType({
  name: 'Human',
  fields: { name: { type: GraphQLString }, homePlanet: { type: GraphQLString } },
  interfaces: [],
});

const DroidType = new GraphQLObjectType({
  name: 'Droid',
  fields: { name: { type: GraphQLString }, primaryFunction: { type: GraphQLString } },
  interfaces: [],
});

const SearchResultUnion = new GraphQLUnionType({
  name: 'SearchResult',
  types: [HumanType, DroidType],
});

// ---------------------------------------------------------------------------
// Mini schema with an interface field
// ---------------------------------------------------------------------------

const CharacterInterface = new GraphQLInterfaceType({
  name: 'Character',
  fields: { name: { type: GraphQLString } },
});

const HumanWithInterface = new GraphQLObjectType({
  name: 'HumanCharacter',
  fields: {
    name: { type: GraphQLString },
    homePlanet: { type: GraphQLString },
  },
  interfaces: [CharacterInterface],
});

const DroidWithInterface = new GraphQLObjectType({
  name: 'DroidCharacter',
  fields: {
    name: { type: GraphQLString },
    primaryFunction: { type: GraphQLString },
  },
  interfaces: [CharacterInterface],
});

// Root types
const QueryWithUnion = new GraphQLObjectType({
  name: 'Query',
  fields: {
    search: { type: SearchResultUnion },
    version: { type: GraphQLString },
  },
});

const QueryWithInterface = new GraphQLObjectType({
  name: 'Query',
  fields: {
    character: { type: CharacterInterface },
    version: { type: GraphQLString },
  },
});

const SchemaWithUnion = new GraphQLSchema({
  query: QueryWithUnion,
  types: [SearchResultUnion, HumanType, DroidType],
});

const SchemaWithInterface = new GraphQLSchema({
  query: QueryWithInterface,
  types: [CharacterInterface, HumanWithInterface, DroidWithInterface],
});

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// ---------------------------------------------------------------------------
// Union field tests
// ---------------------------------------------------------------------------

describe('FieldTree — union field', () => {
  it('renders the union field name', () => {
    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithUnion}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />,
    );
    expect(screen.getByText('search')).toBeInTheDocument();
  });

  it('shows an expand button for a union field', () => {
    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithUnion}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: /expand search/i }),
    ).toBeInTheDocument();
  });

  it('renders type-condition entries for each possible type after expanding', async () => {
    const user = userEvent.setup();
    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithUnion}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand search/i }));

    expect(screen.getByLabelText(/toggle \.\.\. on Human/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle \.\.\. on Droid/i)).toBeInTheDocument();
  });

  it('calls onAddInlineFragment when a type-condition checkbox is checked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithUnion}
        onToggle={() => undefined}
        onSetArg={() => undefined}
        onAddInlineFragment={onAdd}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand search/i }));
    await user.click(screen.getByLabelText(/toggle \.\.\. on Human/i));

    expect(onAdd).toHaveBeenCalledWith(['search'], 'Human');
  });

  it('calls onRemoveInlineFragment when a checked type-condition checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ search { ... on Human { name } } }')}
        schema={SchemaWithUnion}
        onToggle={() => undefined}
        onSetArg={() => undefined}
        onRemoveInlineFragment={onRemove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand search/i }));
    // Human fragment is already present so checkbox should be checked
    const humanCheckbox = screen.getByLabelText(/toggle \.\.\. on Human/i);
    expect(humanCheckbox).toBeChecked();
    await user.click(humanCheckbox);

    expect(onRemove).toHaveBeenCalledWith(['search'], 'Human');
  });

  it('type-condition checkbox is checked when inline fragment is present in doc', async () => {
    const user = userEvent.setup();

    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ search { ... on Droid { primaryFunction } } }')}
        schema={SchemaWithUnion}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand search/i }));
    expect(screen.getByLabelText(/toggle \.\.\. on Droid/i)).toBeChecked();
    expect(screen.getByLabelText(/toggle \.\.\. on Human/i)).not.toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// Interface field tests
// ---------------------------------------------------------------------------

describe('FieldTree — interface field', () => {
  it('renders type-condition entries for each implementing type', async () => {
    const user = userEvent.setup();

    render(
      <FieldTree
        type={QueryWithInterface}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithInterface}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand character/i }));

    expect(screen.getByLabelText(/toggle \.\.\. on HumanCharacter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle \.\.\. on DroidCharacter/i)).toBeInTheDocument();
  });

  it('expanding a concrete type under an interface shows its fields', async () => {
    const user = userEvent.setup();

    render(
      <FieldTree
        type={QueryWithInterface}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithInterface}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand character/i }));
    await user.click(screen.getByRole('button', { name: /expand \.\.\. on HumanCharacter/i }));

    expect(screen.getByText('homePlanet')).toBeInTheDocument();
  });
});
