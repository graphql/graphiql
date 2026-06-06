import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ResolverTrace } from '@graphiql/toolkit';
import { TraceFooter } from './';

const meta: Meta<typeof TraceFooter> = {
  title: 'Primitives/TraceFooter',
  component: TraceFooter,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TraceFooter>;

const FLAT_TRACES: ResolverTrace[] = [
  {
    path: ['hero'],
    parentType: 'Query',
    fieldName: 'hero',
    returnType: 'Character',
    startOffsetMs: 0,
    durationMs: 120,
  },
  {
    path: ['reviews'],
    parentType: 'Query',
    fieldName: 'reviews',
    returnType: '[Review]',
    startOffsetMs: 5,
    durationMs: 88,
  },
];

const NESTED_TRACES: ResolverTrace[] = [
  {
    path: ['user'],
    parentType: 'Query',
    fieldName: 'user',
    returnType: 'User',
    startOffsetMs: 0,
    durationMs: 95,
  },
  {
    path: ['user', 'name'],
    parentType: 'User',
    fieldName: 'name',
    returnType: 'String',
    startOffsetMs: 10,
    durationMs: 2,
  },
  {
    path: ['user', 'posts'],
    parentType: 'User',
    fieldName: 'posts',
    returnType: '[Post]',
    startOffsetMs: 15,
    durationMs: 60,
  },
  {
    path: ['user', 'posts', 'title'],
    parentType: 'Post',
    fieldName: 'title',
    returnType: 'String',
    startOffsetMs: 20,
    durationMs: 1,
  },
];

export const FlatResolvers: Story = {
  args: {
    traces: FLAT_TRACES,
    totalMs: 200,
  },
};

export const NestedResolvers: Story = {
  args: {
    traces: NESTED_TRACES,
    totalMs: 150,
  },
};

export const SingleResolver: Story = {
  args: {
    traces: [
      {
        path: ['ping'],
        parentType: 'Query',
        fieldName: 'ping',
        returnType: 'String',
        startOffsetMs: 0,
        durationMs: 3,
      },
    ],
    totalMs: 10,
  },
};

export const ManyResolvers: Story = {
  name: 'Many resolvers (scrollable)',
  args: {
    traces: Array.from({ length: 20 }, (_, i) => ({
      path: ['items', String(i), 'name'],
      parentType: 'Item',
      fieldName: 'name',
      returnType: 'String',
      startOffsetMs: i * 4,
      durationMs: 2 + (i % 5),
    })),
    totalMs: 120,
  },
};
