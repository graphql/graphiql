import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  parse,
} from 'graphql';
import { Tooltip, GraphiQLProvider } from '@graphiql/react';
import type { ReactNode } from 'react';
import { QueryBuilder } from '../components/query-builder';
import { ArgInput } from '../components/arg-input';
import { FieldRow } from '../components/field-row';
import { FieldTree } from '../components/field-tree';
import { FragmentSection } from '../components/fragment-section';
import '../index.css';

// ---------------------------------------------------------------------------
// Demo schema — Star Wars flavoured, scalar leaves + one nested object type
// ---------------------------------------------------------------------------

const EpisodeEnum = new GraphQLEnumType({
  name: 'Episode',
  values: {
    NEWHOPE: { value: 4 },
    EMPIRE: { value: 5 },
    JEDI: { value: 6 },
  },
});

const FriendType = new GraphQLObjectType({
  name: 'Friend',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
  },
});

const HeroType = new GraphQLObjectType({
  name: 'Hero',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    appearsIn: { type: new GraphQLList(EpisodeEnum) },
    isAlive: { type: GraphQLBoolean },
    friends: { type: new GraphQLList(FriendType) },
  }),
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hero: { type: HeroType },
    version: { type: GraphQLString },
    uptime: { type: GraphQLBoolean },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createHero: { type: HeroType },
    deleteHero: { type: GraphQLBoolean },
  },
});

const DemoSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

// ---------------------------------------------------------------------------
// Shared decorator
// ---------------------------------------------------------------------------

// Minimal fetcher that immediately resolves with empty data.
const mockFetcher = async () => ({ data: null });

function withProvider(schema: GraphQLSchema | null, children: ReactNode) {
  return (
    <Tooltip.Provider>
      <GraphiQLProvider
        fetcher={mockFetcher}
        schema={schema}
        dangerouslyAssumeSchemaIsValid
      >
        <div style={{ width: 320, background: 'oklch(var(--bg-elevated))', minHeight: 400 }}>
          {children}
        </div>
      </GraphiQLProvider>
    </Tooltip.Provider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Plugins/QueryBuilder',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
// QueryBuilder — with schema
// ---------------------------------------------------------------------------

export const WithSchema: Story = {
  render: () => withProvider(DemoSchema, <QueryBuilder />),
};

// ---------------------------------------------------------------------------
// QueryBuilder — no schema loaded
// ---------------------------------------------------------------------------

export const NoSchema: Story = {
  render: () => withProvider(null, <QueryBuilder />),
};

// ---------------------------------------------------------------------------
// FieldRow — scalar field, unchecked
// ---------------------------------------------------------------------------

const scalarField = HeroType.getFields()['name']!;

export const FieldRowScalarUnchecked: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FieldRow
        field={scalarField}
        path={['hero']}
        selected={false}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// FieldRow — scalar field, checked
// ---------------------------------------------------------------------------

export const FieldRowScalarChecked: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FieldRow
        field={scalarField}
        path={['hero']}
        selected={true}
        hasChildren={false}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// FieldRow — object field with expand button
// ---------------------------------------------------------------------------

const objectField = QueryType.getFields()['hero']!;

export const FieldRowObjectCollapsed: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FieldRow
        field={objectField}
        path={[]}
        selected={false}
        hasChildren={true}
        expanded={false}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />
    </div>
  ),
};

export const FieldRowObjectExpanded: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FieldRow
        field={objectField}
        path={[]}
        selected={false}
        hasChildren={true}
        expanded={true}
        onToggle={() => undefined}
        onExpand={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// FieldTree — root type only (no children expanded)
// ---------------------------------------------------------------------------

const emptyDoc = parse('{ __typename }');

export const FieldTreeRootOnly: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FieldTree
        type={QueryType}
        path={[]}
        doc={emptyDoc}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// FieldTree — with pre-selected fields
// ---------------------------------------------------------------------------

const preSelectedDoc = parse('{ hero { name } version }');

export const FieldTreeWithSelections: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FieldTree
        type={QueryType}
        path={[]}
        doc={preSelectedDoc}
        onToggle={() => undefined}
        onSetArg={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// ArgInput — individual input controls
// ---------------------------------------------------------------------------

const scalarIntArg = { name: 'first', type: GraphQLInt, description: null, defaultValue: undefined, deprecationReason: null, extensions: {}, astNode: undefined } as Parameters<typeof ArgInput>[0]['arg'];
const scalarFloatArg = { name: 'scale', type: GraphQLFloat, description: null, defaultValue: undefined, deprecationReason: null, extensions: {}, astNode: undefined } as Parameters<typeof ArgInput>[0]['arg'];
const scalarStringArg = { name: 'query', type: GraphQLString, description: null, defaultValue: undefined, deprecationReason: null, extensions: {}, astNode: undefined } as Parameters<typeof ArgInput>[0]['arg'];
const scalarBoolArg = { name: 'active', type: GraphQLBoolean, description: null, defaultValue: undefined, deprecationReason: null, extensions: {}, astNode: undefined } as Parameters<typeof ArgInput>[0]['arg'];
const enumArg = { name: 'episode', type: EpisodeEnum, description: null, defaultValue: undefined, deprecationReason: null, extensions: {}, astNode: undefined } as Parameters<typeof ArgInput>[0]['arg'];

export const ArgInputInt: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <ArgInput arg={scalarIntArg} value="10" onChange={() => undefined} />
    </div>
  ),
};

export const ArgInputFloat: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <ArgInput arg={scalarFloatArg} value="1.5" onChange={() => undefined} />
    </div>
  ),
};

export const ArgInputString: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <ArgInput arg={scalarStringArg} value="Luke" onChange={() => undefined} />
    </div>
  ),
};

export const ArgInputBoolean: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <ArgInput arg={scalarBoolArg} value="true" onChange={() => undefined} />
    </div>
  ),
};

export const ArgInputEnum: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <ArgInput arg={enumArg} value="JEDI" onChange={() => undefined} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// FieldRow — field with scalar args, checked (args visible)
// ---------------------------------------------------------------------------

const QueryTypeWithArgs = new GraphQLObjectType({
  name: 'QueryWithArgs',
  fields: {
    hero: {
      type: HeroType,
      args: {
        id: { type: GraphQLString },
        episode: { type: EpisodeEnum },
        first: { type: GraphQLInt },
      },
    },
  },
});

const heroFieldWithArgs = QueryTypeWithArgs.getFields()['hero']!;

export const FieldRowScalarArgsChecked: Story = {
  render: () => (
    <div style={{ padding: 16, width: 400 }}>
      <FieldRow
        field={heroFieldWithArgs}
        path={[]}
        selected={true}
        hasChildren={true}
        expanded={false}
        argValues={{ id: 'abc', first: '5' }}
        onToggle={() => undefined}
        onExpand={() => undefined}
        onSetArg={() => undefined}
      />
    </div>
  ),
};

export const FieldRowEnumArgChecked: Story = {
  render: () => (
    <div style={{ padding: 16, width: 400 }}>
      <FieldRow
        field={heroFieldWithArgs}
        path={[]}
        selected={true}
        hasChildren={true}
        expanded={false}
        argValues={{ episode: 'JEDI' }}
        onToggle={() => undefined}
        onExpand={() => undefined}
        onSetArg={() => undefined}
      />
    </div>
  ),
};

export const FieldRowMixedArgsChecked: Story = {
  render: () => (
    <div style={{ padding: 16, width: 400 }}>
      <FieldRow
        field={heroFieldWithArgs}
        path={[]}
        selected={true}
        hasChildren={true}
        expanded={false}
        argValues={{ id: 'abc', episode: 'NEWHOPE', first: '10' }}
        onToggle={() => undefined}
        onExpand={() => undefined}
        onSetArg={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// ArgInput — list and input object stories
// ---------------------------------------------------------------------------

const TagInput = new GraphQLInputObjectType({
  name: 'TagInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    value: { type: GraphQLString },
  },
});

const DeepInput = new GraphQLInputObjectType({
  name: 'DeepInput',
  fields: {
    label: { type: GraphQLString },
    tag: { type: TagInput },
  },
});

const listStringArg = {
  name: 'tags',
  type: new GraphQLList(GraphQLString),
  description: null,
  defaultValue: undefined,
  deprecationReason: null,
  extensions: {},
  astNode: undefined,
} as Parameters<typeof ArgInput>[0]['arg'];

const listInputObjectArg = {
  name: 'tags',
  type: new GraphQLList(TagInput),
  description: null,
  defaultValue: undefined,
  deprecationReason: null,
  extensions: {},
  astNode: undefined,
} as Parameters<typeof ArgInput>[0]['arg'];

const inputObjectArg = {
  name: 'input',
  type: TagInput,
  description: null,
  defaultValue: undefined,
  deprecationReason: null,
  extensions: {},
  astNode: undefined,
} as Parameters<typeof ArgInput>[0]['arg'];

const deepInputObjectArg = {
  name: 'config',
  type: DeepInput,
  description: null,
  defaultValue: undefined,
  deprecationReason: null,
  extensions: {},
  astNode: undefined,
} as Parameters<typeof ArgInput>[0]['arg'];

export const ArgInputListOfScalars: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <ArgInput
        arg={listStringArg}
        value={JSON.stringify(['alpha', 'beta'])}
        onChange={() => undefined}
      />
    </div>
  ),
};

export const ArgInputListOfInputObjects: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <ArgInput
        arg={listInputObjectArg}
        value={JSON.stringify([{ name: 'hero', value: '1' }, { name: 'jedi' }])}
        onChange={() => undefined}
      />
    </div>
  ),
};

export const ArgInputInputObject: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <ArgInput
        arg={inputObjectArg}
        value={JSON.stringify({ name: 'alpha', value: 'test' })}
        onChange={() => undefined}
      />
    </div>
  ),
};

export const ArgInputDeeplyNestedInputObject: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <ArgInput
        arg={deepInputObjectArg}
        value={JSON.stringify({ label: 'outer', tag: { name: 'inner', value: 'deep' } })}
        onChange={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// ArgInput — variable toggle stories
// ---------------------------------------------------------------------------

const intArgForVar = {
  name: 'first',
  type: GraphQLInt,
  description: null,
  defaultValue: undefined,
  deprecationReason: null,
  extensions: {},
  astNode: undefined,
} as Parameters<typeof ArgInput>[0]['arg'];

/** Scalar arg with the "use as variable" toggle available, not yet promoted. */
export const ArgInputVarToggleOff: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>first:</label>
      <ArgInput
        arg={intArgForVar}
        value="10"
        onChange={() => undefined}
        isVariable={false}
        onPromote={() => undefined}
        onDemote={() => undefined}
      />
    </div>
  ),
};

/** Scalar arg promoted to a variable — shows the $name badge and active toggle. */
export const ArgInputVarToggleOn: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>first:</label>
      <ArgInput
        arg={intArgForVar}
        value=""
        onChange={() => undefined}
        isVariable
        variableName="first"
        onPromote={() => undefined}
        onDemote={() => undefined}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// FragmentSection stories
// ---------------------------------------------------------------------------

const docNoFragments = parse('{ hero { name } }');
const docWithFragments = parse(`
  { hero { ...HeroFields } droid { ...DroidFields } }
  fragment HeroFields on Hero { name appearsIn }
  fragment DroidFields on Droid { primaryFunction }
`);

/** Fragment panel with no fragments defined. */
export const FragmentSectionEmpty: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FragmentSection doc={docNoFragments} onCreateFragment={() => undefined} />
    </div>
  ),
};

/** Fragment panel listing two existing named fragments. */
export const FragmentSectionWithFragments: Story = {
  render: () => (
    <div style={{ padding: 16, width: 320 }}>
      <FragmentSection doc={docWithFragments} onCreateFragment={() => undefined} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Union and interface field stories
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

const CharacterInterface = new GraphQLInterfaceType({
  name: 'Character',
  fields: {
    name: { type: GraphQLString },
    appearsIn: { type: new GraphQLList(EpisodeEnum) },
  },
});

const HumanWithInterface = new GraphQLObjectType({
  name: 'HumanCharacter',
  fields: {
    name: { type: GraphQLString },
    homePlanet: { type: GraphQLString },
    appearsIn: { type: new GraphQLList(EpisodeEnum) },
  },
  interfaces: [CharacterInterface],
});

const DroidWithInterface = new GraphQLObjectType({
  name: 'DroidCharacter',
  fields: {
    name: { type: GraphQLString },
    primaryFunction: { type: GraphQLString },
    appearsIn: { type: new GraphQLList(EpisodeEnum) },
  },
  interfaces: [CharacterInterface],
});

const UnionSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      search: { type: SearchResultUnion },
      hero: { type: HeroType },
    },
  }),
  types: [SearchResultUnion, HumanType, DroidType],
});

const InterfaceSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      character: { type: CharacterInterface },
      hero: { type: HeroType },
    },
  }),
  types: [CharacterInterface, HumanWithInterface, DroidWithInterface],
});

/** QueryBuilder with a union field — type-condition selectors appear when the field is expanded. */
export const WithUnionField: Story = {
  render: () => withProvider(UnionSchema, <QueryBuilder />),
};

/** QueryBuilder with an interface field — type-condition selectors for each implementing type. */
export const WithInterfaceField: Story = {
  render: () => withProvider(InterfaceSchema, <QueryBuilder />),
};
