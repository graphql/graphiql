import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResponseTreeView } from './';

const meta: Meta<typeof ResponseTreeView> = {
  title: 'Components/ResponseTreeView',
  component: ResponseTreeView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof ResponseTreeView>;

export const NullResponse: Story = {
  name: 'Null value',
  args: {
    data: null,
  },
};

export const ScalarString: Story = {
  name: 'Scalar string',
  args: {
    data: 'Hello, GraphQL!',
  },
};

export const SimpleObject: Story = {
  name: 'Simple object (top level expanded)',
  args: {
    data: {
      data: {
        id: '1',
        name: 'Luke Skywalker',
        height: 172,
        mass: 77,
        appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
      },
    },
  },
};

export const NestedObject: Story = {
  name: 'Nested object (deeper levels collapsed)',
  args: {
    data: {
      data: {
        hero: {
          name: 'R2-D2',
          friends: [
            {
              name: 'Luke Skywalker',
              homeworld: { name: 'Tatooine' },
            },
            {
              name: 'Han Solo',
              homeworld: { name: 'Corellia' },
            },
            {
              name: 'Leia Organa',
              homeworld: { name: 'Alderaan' },
            },
          ],
        },
      },
    },
  },
};

export const LargeArray: Story = {
  name: 'Large array (collapsed)',
  args: {
    data: {
      data: {
        allPeople: {
          edges: Array.from({ length: 82 }, (_, i) => ({
            node: { id: String(i + 1), name: `Person ${i + 1}` },
          })),
        },
      },
    },
    initiallyExpandedDepth: 1,
  },
};

export const MixedTypes: Story = {
  name: 'Mixed scalar types',
  args: {
    data: {
      data: {
        string: 'hello',
        number: 42,
        float: 3.14,
        boolean: true,
        falsyBool: false,
        nullValue: null,
        emptyString: '',
      },
    },
  },
};

export const EmptyObject: Story = {
  name: 'Empty object',
  args: {
    data: {},
  },
};

export const ErrorResponse: Story = {
  name: 'Error response',
  args: {
    data: {
      errors: [
        {
          message: 'Cannot query field "notARealField" on type "Query".',
          locations: [{ line: 3, column: 5 }],
          path: ['hero', 'notARealField'],
        },
      ],
      data: null,
    },
  },
};
