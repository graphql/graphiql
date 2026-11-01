import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResponseTableView } from './';

const meta: Meta<typeof ResponseTableView> = {
  title: 'Components/ResponseTableView',
  component: ResponseTableView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div
        style={{
          height: 400,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid oklch(var(--border-default))',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ResponseTableView>;

export const ListOfObjects: Story = {
  name: 'List of objects',
  args: {
    data: {
      data: {
        users: [
          { id: 1, name: 'Alice', role: 'admin', email: 'alice@example.com' },
          { id: 2, name: 'Bob', role: 'user', email: 'bob@example.com' },
          { id: 3, name: 'Carol', role: 'user', email: 'carol@example.com' },
        ],
      },
    },
  },
};

export const RaggedRows: Story = {
  name: 'Ragged rows (inconsistent keys)',
  args: {
    data: {
      data: {
        products: [
          { id: 'A1', name: 'Widget', price: 9.99, discount: 0.1 },
          { id: 'B2', name: 'Gadget', price: 14.99 },
          { id: 'C3', name: 'Doohickey', price: 4.5, tags: ['sale', 'new'] },
        ],
      },
    },
  },
};

export const NestedObjects: Story = {
  name: 'Cells with nested objects and arrays',
  args: {
    data: {
      data: {
        orders: [
          {
            id: 101,
            customer: { name: 'Alice', id: 1 },
            items: ['A1', 'C3'],
            total: 14.49,
          },
          {
            id: 102,
            customer: { name: 'Bob', id: 2 },
            items: ['B2'],
            total: 14.99,
          },
        ],
      },
    },
  },
};

export const NestedList: Story = {
  name: 'List nested inside a wrapper field',
  args: {
    data: {
      data: {
        usersConnection: {
          totalCount: 3,
          nodes: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Carol' },
          ],
        },
      },
    },
  },
};

export const SiblingLists: Story = {
  name: 'Multiple sibling lists (one table each)',
  args: {
    data: {
      data: {
        test: {
          person: {
            name: 'Alice',
            age: 30,
            friends: [{ age: 28 }, { age: 34 }],
            a: [{ age: 41 }],
          },
        },
      },
    },
  },
};

export const PrimitiveArray: Story = {
  name: 'Primitive array (no table possible)',
  args: {
    data: {
      data: {
        tags: ['graphql', 'api', 'rest'],
      },
    },
  },
};

export const EmptyArray: Story = {
  name: 'Empty array (no rows)',
  args: {
    data: {
      data: {
        users: [],
      },
    },
  },
};

export const NoListField: Story = {
  name: 'Non-list response (scalar fields only)',
  args: {
    data: {
      data: {
        user: { id: 1, name: 'Alice', role: 'admin' },
      },
    },
  },
};

export const NoResponse: Story = {
  name: 'No response yet',
  args: {
    data: null,
  },
};
