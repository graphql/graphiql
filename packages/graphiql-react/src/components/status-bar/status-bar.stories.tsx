import type { Meta, StoryObj } from '@storybook/react-vite';
import { buildSchema } from 'graphql';
import { StatusBarView } from './';

const SCHEMA = buildSchema(`
  type Query {
    hero: Character
    heroes: [Character]
    search(text: String): [SearchResult]
  }

  union SearchResult = Human | Droid

  interface Character {
    id: ID!
    name: String!
    friends: [Character]
    appearsIn: [Episode]!
  }

  enum Episode { NEWHOPE EMPIRE JEDI }

  type Human implements Character {
    id: ID!
    name: String!
    friends: [Character]
    appearsIn: [Episode]!
    homePlanet: String
    height(unit: LengthUnit = METER): Float
    mass: Float
    starships: [Starship]
  }

  type Droid implements Character {
    id: ID!
    name: String!
    friends: [Character]
    appearsIn: [Episode]!
    primaryFunction: String
  }

  type Starship { id: ID! name: String! }

  enum LengthUnit { METER FOOT }
`);

const typeCount = Object.keys(SCHEMA.getTypeMap()).length;

const meta: Meta<typeof StatusBarView> = {
  title: 'Layout/StatusBar',
  component: StatusBarView,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof StatusBarView>;

export const Disconnected: Story = {
  args: {
    isConnected: false,
    typeCount: 0,
    pluginCount: 0,
  },
};

export const Connected: Story = {
  args: {
    isConnected: true,
    typeCount,
    pluginCount: 0,
  },
};

export const WithPlugins: Story = {
  args: {
    isConnected: true,
    typeCount,
    pluginCount: 2,
  },
};

export const CustomEncoding: Story = {
  args: {
    isConnected: false,
    typeCount: 0,
    pluginCount: 0,
    encoding: 'UTF-16',
  },
};
