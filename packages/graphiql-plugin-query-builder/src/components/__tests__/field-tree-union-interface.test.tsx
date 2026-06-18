import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInterfaceType,
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
  fields: {
    name: { type: GraphQLString },
    homePlanet: { type: GraphQLString },
  },
  interfaces: [],
});

const DroidType = new GraphQLObjectType({
  name: 'Droid',
  fields: {
    name: { type: GraphQLString },
    primaryFunction: { type: GraphQLString },
  },
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

// ---------------------------------------------------------------------------
// Mini schema where an implementor implements a second interface (interface
// implementing interface): `node: Node`, with `User` also implementing
// `Timestamped`.
// ---------------------------------------------------------------------------

const TimestampedInterface = new GraphQLInterfaceType({
  name: 'Timestamped',
  fields: { createdAt: { type: GraphQLString } },
});

const NodeInterface = new GraphQLInterfaceType({
  name: 'Node',
  fields: { id: { type: GraphQLString } },
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    email: { type: GraphQLString },
  },
  interfaces: [NodeInterface, TimestampedInterface],
});

const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: { id: { type: GraphQLString }, title: { type: GraphQLString } },
  interfaces: [NodeInterface],
});

const QueryWithNode = new GraphQLObjectType({
  name: 'Query',
  fields: { node: { type: NodeInterface } },
});

const SchemaWithNode = new GraphQLSchema({
  query: QueryWithNode,
  types: [NodeInterface, TimestampedInterface, UserType, PostType],
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
        onToggle={() => {}}
        onSetArg={() => {}}
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
        onToggle={() => {}}
        onSetArg={() => {}}
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
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand search/i }));

    // A union has no own fields, so its type conditions show directly.
    expect(
      screen.getByLabelText(/toggle \.\.\. on Human/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/toggle \.\.\. on Droid/i),
    ).toBeInTheDocument();
  });

  it('does not wrap union type conditions in a collapsible section', async () => {
    const user = userEvent.setup();
    render(
      <FieldTree
        type={QueryWithUnion}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithUnion}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand search/i }));

    // No "Possible types" collapse for unions — the conditions are the only
    // content, so they show directly.
    expect(
      screen.queryByRole('button', { name: /possible types/i }),
    ).toBeNull();
    expect(
      screen.getByLabelText(/toggle \.\.\. on Human/i),
    ).toBeInTheDocument();
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
        onToggle={() => {}}
        onSetArg={() => {}}
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
        onToggle={() => {}}
        onSetArg={() => {}}
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
        onToggle={() => {}}
        onSetArg={() => {}}
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
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand character/i }));
    await user.click(screen.getByRole('button', { name: /possible types/i }));

    expect(
      screen.getByLabelText(/toggle \.\.\. on HumanCharacter/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/toggle \.\.\. on DroidCharacter/i),
    ).toBeInTheDocument();
  });

  it('expanding a concrete type under an interface shows its fields', async () => {
    const user = userEvent.setup();

    render(
      <FieldTree
        type={QueryWithInterface}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithInterface}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand character/i }));
    await user.click(screen.getByRole('button', { name: /possible types/i }));
    await user.click(
      screen.getByRole('button', { name: /expand \.\.\. on HumanCharacter/i }),
    );

    expect(screen.getByText('homePlanet')).toBeInTheDocument();
  });

  it('keeps possible types collapsed behind a labeled section by default', async () => {
    const user = userEvent.setup();
    render(
      <FieldTree
        type={QueryWithInterface}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithInterface}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand character/i }));

    expect(
      screen.getByRole('button', { name: /possible types/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/toggle \.\.\. on HumanCharacter/i),
    ).toBeNull();
  });

  it("lets an interface's own field be selected directly", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <FieldTree
        type={QueryWithInterface}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithInterface}
        onToggle={onToggle}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand character/i }));
    // The interface's shared `name` field has a checkbox directly under the
    // field, no type condition required.
    await user.click(screen.getByLabelText(/toggle name/i));

    expect(onToggle).toHaveBeenCalledWith(['character', 'name']);
  });
});

// ---------------------------------------------------------------------------
// Interface implementing interface
// ---------------------------------------------------------------------------

describe('FieldTree — interface implementing interface', () => {
  it('offers a sibling interface as a type condition, tagged as an interface', async () => {
    const user = userEvent.setup();
    render(
      <FieldTree
        type={QueryWithNode}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithNode}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand node/i }));
    await user.click(screen.getByRole('button', { name: /possible types/i }));

    // Concrete implementors are offered...
    expect(screen.getByLabelText(/toggle \.\.\. on User/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle \.\.\. on Post/i)).toBeInTheDocument();
    // ...plus the sibling interface that an implementor also implements, marked
    // as an interface so it's clear it matches several types.
    expect(
      screen.getByLabelText(/toggle \.\.\. on Timestamped/i),
    ).toBeInTheDocument();
    expect(screen.getByText('interface')).toBeInTheDocument();
  });

  it('recurses: expanding an interface condition reveals its own possible types', async () => {
    const user = userEvent.setup();
    render(
      <FieldTree
        type={QueryWithNode}
        path={[]}
        doc={doc('{ __typename }')}
        schema={SchemaWithNode}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /expand node/i }));
    await user.click(screen.getByRole('button', { name: /possible types/i }));
    // Only the node field's own possible types so far.
    expect(
      screen.getAllByRole('button', { name: /possible types/i }),
    ).toHaveLength(1);

    // Expanding the sibling interface condition surfaces ITS possible types
    // (a second, nested section) so you can narrow further.
    await user.click(
      screen.getByRole('button', { name: /expand \.\.\. on Timestamped/i }),
    );
    expect(
      screen.getAllByRole('button', { name: /possible types/i }).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
