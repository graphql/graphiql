import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButtonView } from './';
import { Tooltip } from '../tooltip';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const operations = opsOf(
  'query GetViewer { viewer { id name } }\nmutation UpdateProfile { updateProfile { id name } }\nsubscription OnWidget { widgetAdded { id } }',
);

const meta: Meta<typeof ExecuteButtonView> = {
  title: 'Components/ExecuteButton',
  component: ExecuteButtonView,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tooltip.Provider>
        <Story />
      </Tooltip.Provider>
    ),
  ],
  args: {
    isFetching: false,
    operations,
    operationName: 'GetViewer',
    queryMethod: 'QUERY',
    supportedMethods: ['QUERY', 'POST', 'GET'],
    isMethodAutomatic: true,
    onRun() {},
    onStop() {},
    onSetOperationName() {},
    onSetMethod() {},
  },
};
export default meta;

type Story = StoryObj<typeof ExecuteButtonView>;

export const Default: Story = {};

/** Selecting an operation only selects it; Run is a separate action. */
export const MultipleOperationsWithPicker: Story = {
  render(args) {
    const [operationName, setOperationName] = useState('GetViewer');
    const [methodOverride, setMethod] = useState<HttpMethod>();
    const [isFetching, setFetching] = useState(false);
    return (
      <ExecuteButtonView
        {...args}
        operationName={operationName}
        onSetOperationName={setOperationName}
        queryMethod={methodOverride ?? 'QUERY'}
        methodOverride={methodOverride}
        isMethodAutomatic={methodOverride === undefined}
        onSetMethod={setMethod}
        isFetching={isFetching}
        onRun={() => setFetching(true)}
        onStop={() => setFetching(false)}
      />
    );
  },
};

export const QueryOverride: Story = {
  args: { queryMethod: 'GET', methodOverride: 'GET', isMethodAutomatic: false },
};

/** A mutation uses POST regardless of the stored query preference. */
export const Mutation: Story = {
  args: {
    operationName: 'UpdateProfile',
    queryMethod: 'GET',
    methodOverride: 'GET',
    isMethodAutomatic: false,
  },
};

export const SingleOperation: Story = {
  args: { operations: opsOf('query GetViewer { viewer { id } }') },
};

export const SingleMethod: Story = {
  args: { queryMethod: 'POST', supportedMethods: ['POST'] },
};

export const AnonymousOperation: Story = {
  args: { operations: opsOf('{ viewer { id } }'), operationName: null },
};

export const LongOperationName: Story = {
  args: {
    operations: opsOf(
      'query GetViewerWithOrganizationPermissions { viewer { id } }\nmutation UpdateProfile { updateProfile { id } }',
    ),
    operationName: 'GetViewerWithOrganizationPermissions',
  },
};

/** A request in flight keeps its operation visible and disables selection. */
export const Running: Story = {
  args: { isFetching: true },
};

export const Subscription: Story = {
  args: {
    operations: opsOf('subscription OnWidget { widgetAdded { id } }'),
    operationName: 'OnWidget',
  },
};

export const Subscribed: Story = {
  args: { ...Subscription.args, isSubscribed: true },
};

export const LegacyFetcher: Story = {
  args: {
    queryMethod: undefined,
    supportedMethods: undefined,
    onSetMethod: undefined,
    isMethodAutomatic: false,
  },
};
