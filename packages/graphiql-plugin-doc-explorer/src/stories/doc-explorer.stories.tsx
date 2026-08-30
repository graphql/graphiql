import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';
import { Tooltip } from '@graphiql/react';
import { DocExplorerStore } from '../context';
import { TypeDocumentation } from '../components/type-documentation';
import { FieldDocumentation } from '../components/field-documentation';
import { SchemaDocumentation } from '../components/schema-documentation';
import { TypeCard } from '../components/type-card';
import { FieldsList } from '../components/fields-list';
import { Breadcrumb } from '../components/breadcrumb';
import { TypeLink } from '../components/type-link';
import { FieldLink } from '../components/field-link';
import { Argument } from '../components/argument';

const EpisodeEnum = new GraphQLEnumType({
  name: 'Episode',
  description: 'One of the films in the Star Wars Trilogy',
  values: {
    NEWHOPE: { value: 4, description: 'Released in 1977' },
    EMPIRE: { value: 5, description: 'Released in 1980' },
    JEDI: {
      value: 6,
      description: 'Released in 1983',
      deprecationReason: 'Use RETURN_OF_THE_JEDI',
    },
  },
});

const CharacterInterface = new GraphQLInterfaceType({
  name: 'Character',
  description: 'A character in the Star Wars universe',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Unique identifier',
    },
    name: { type: GraphQLString, description: "The character's name" },
    appearsIn: {
      type: new GraphQLList(EpisodeEnum),
      description: 'Which films they appear in',
    },
  }),
});

const ReviewInputType = new GraphQLInputObjectType({
  name: 'ReviewInput',
  description: 'Input for creating a film review',
  fields: {
    stars: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Number of stars (1–5)',
    },
    commentary: {
      type: GraphQLString,
      description: 'An optional explanation for the rating',
    },
  },
});

const HumanType = new GraphQLObjectType({
  name: 'Human',
  description: 'A humanoid creature in the Star Wars universe',
  interfaces: [CharacterInterface],
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString), description: 'Unique ID' },
    name: { type: GraphQLString, description: 'Name of the human' },
    homePlanet: {
      type: GraphQLString,
      description: 'The home planet of the human, or null if unknown',
    },
    appearsIn: {
      type: new GraphQLList(EpisodeEnum),
      description: 'Which films they appear in',
    },
    friends: {
      type: new GraphQLList(CharacterInterface),
      description: 'The friends of the human',
      deprecationReason: 'Use friendsConnection instead',
    },
  }),
});

const SearchResultUnion = new GraphQLUnionType({
  name: 'SearchResult',
  description: 'A result from a global search',
  types: [HumanType],
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'The root query type for the Star Wars API',
  fields: {
    hero: {
      type: CharacterInterface,
      description: 'Returns the hero of the Star Wars universe',
      args: {
        episode: {
          type: EpisodeEnum,
          description:
            'If provided, returns the hero of that particular episode',
        },
      },
    },
    human: {
      type: HumanType,
      description: 'Returns a human character by ID',
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'ID of the human to fetch',
        },
      },
    },
    isAlive: {
      type: GraphQLBoolean,
      deprecationReason: 'Use `hero` with status field instead',
    },
    search: {
      type: SearchResultUnion,
      description: 'Search across all types',
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createReview: {
      type: GraphQLBoolean,
      description: 'Submit a review for a film',
      args: {
        episode: { type: EpisodeEnum },
        review: { type: new GraphQLNonNull(ReviewInputType) },
      },
    },
  },
});

const StarWarsSchema = new GraphQLSchema({
  description: 'The Star Wars GraphQL API',
  query: QueryType,
  mutation: MutationType,
  types: [
    HumanType,
    CharacterInterface,
    EpisodeEnum,
    ReviewInputType,
    SearchResultUnion,
  ],
});

function withDocExplorerStore(Story: React.FC) {
  return (
    <Tooltip.Provider>
      <DocExplorerStore>
        <Story />
      </DocExplorerStore>
    </Tooltip.Provider>
  );
}

const meta: Meta = {
  title: 'DocExplorer',
  tags: ['autodocs'],
  decorators: [withDocExplorerStore],
};

export default meta;

type Story = StoryObj;

export const SchemaOverview: Story = {
  name: 'Schema overview',
  render: function SchemaOverviewStory() {
    return <SchemaDocumentation schema={StarWarsSchema} />;
  },
};

export const TypeDetailObject: Story = {
  name: 'Type detail — Object',
  render: function TypeDetailObjectStory() {
    return (
      <>
        <TypeCard type={HumanType} />
        <FieldsList type={HumanType} />
      </>
    );
  },
};

export const TypeDetailInterface: Story = {
  name: 'Type detail — Interface',
  render: function TypeDetailInterfaceStory() {
    return (
      <>
        <TypeCard type={CharacterInterface} />
        <FieldsList type={CharacterInterface} />
      </>
    );
  },
};

export const TypeDetailInput: Story = {
  name: 'Type detail — Input',
  render: function TypeDetailInputStory() {
    return (
      <>
        <TypeCard type={ReviewInputType} />
        <FieldsList type={ReviewInputType} />
      </>
    );
  },
};

export const TypeDetailEnum: Story = {
  name: 'Type detail — Enum',
  render: function TypeDetailEnumStory() {
    return (
      <>
        <TypeCard type={EpisodeEnum} />
        <TypeDocumentation type={EpisodeEnum} hideHeader />
      </>
    );
  },
};

export const FieldDetail: Story = {
  name: 'Field detail',
  render: function FieldDetailStory() {
    const heroField = QueryType.getFields()['hero']!;
    return <FieldDocumentation field={heroField} />;
  },
};

export const BreadcrumbNav: Story = {
  name: 'Breadcrumb navigation',
  render: function BreadcrumbNavStory() {
    const navStack: Parameters<typeof Breadcrumb>[0]['navStack'] = [
      { name: 'Root' },
      { name: 'Query', def: QueryType },
      { name: 'Human', def: HumanType },
    ];
    return <Breadcrumb navStack={navStack} onNavigateTo={() => {}} />;
  },
};

export const TokenColors: Story = {
  name: 'Token colors',
  render: function TokenColorsStory() {
    const heroField = QueryType.getFields()['hero']!;
    const episodeArg = heroField.args[0]!;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'oklch(var(--fg-muted))',
              marginBottom: 4,
            }}
          >
            Type link
          </div>
          <TypeLink type={HumanType} />
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'oklch(var(--fg-muted))',
              marginBottom: 4,
            }}
          >
            Field link
          </div>
          <FieldLink field={heroField} />
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'oklch(var(--fg-muted))',
              marginBottom: 4,
            }}
          >
            Argument
          </div>
          <Argument arg={episodeArg} inline />
        </div>
      </div>
    );
  },
};
