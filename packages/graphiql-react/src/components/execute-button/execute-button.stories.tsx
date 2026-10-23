import type { Meta, StoryObj } from '@storybook/react-vite';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButtonView } from './';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const meta: Meta<typeof ExecuteButtonView> = {
  title: 'Components/ExecuteButton',
  component: ExecuteButtonView,
  tags: ['autodocs'],
  args: {
    isFetching: false,
    onRun() {},
    onStop() {},
  },
};
export default meta;

type Story = StoryObj<typeof ExecuteButtonView>;

/** A single operation: a plain pill, no caret. */
export const Default: Story = {
  args: {
    operationName: null,
  },
  render: args => (
    <ExecuteButtonView
      {...args}
      operations={opsOf('query GetWidget { widget { id } }')}
    />
  ),
};

/**
 * Several named operations: the button grows a caret opening the operation
 * picker for queries and mutations.
 */
export const MultipleOperationsWithPicker: Story = {
  args: {
    operationName: 'Beta',
    onSetOperationName() {},
  },
  render: args => (
    <ExecuteButtonView
      {...args}
      operations={opsOf(
        [
          'query Alpha { widget { id } }',
          'query Beta { gadget { id } }',
          'mutation CreateWidget { createWidget { id } }',
        ].join('\n\n'),
      )}
    />
  ),
};

/** A mutation uses the same Run control as any other operation. */
export const Mutation: Story = {
  render: args => (
    <ExecuteButtonView
      {...args}
      operations={opsOf('mutation CreateWidget { createWidget { id } }')}
    />
  ),
};

/** A request in flight: the button becomes Stop, and the picker is hidden. */
export const Running: Story = {
  args: {
    isFetching: true,
  },
  render: args => (
    <ExecuteButtonView
      {...args}
      operations={opsOf(
        'query Alpha { widget { id } }\nquery Beta { gadget { id } }',
      )}
    />
  ),
};

/** An active subscription holds the button in its stop state. */
export const Subscribed: Story = {
  args: {
    isSubscribed: true,
  },
  render: args => (
    <ExecuteButtonView
      {...args}
      operations={opsOf('subscription OnWidget { widgetAdded { id } }')}
    />
  ),
};
