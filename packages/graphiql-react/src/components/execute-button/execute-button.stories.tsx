import type { Meta, StoryObj } from '@storybook/react-vite';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButtonView } from './';
import { Tooltip } from '../tooltip';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

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
    onRun() {},
    onStop() {},
  },
};
export default meta;

type Story = StoryObj<typeof ExecuteButtonView>;

/** A single operation: a plain pill, no caret. */
export const Default: Story = {
  args: {
    operations: opsOf('query GetWidget { widget { id } }'),
    operationName: null,
  },
};

/**
 * Several named operations: the button grows a caret opening the operation
 * picker. GET is selected, so the mutation's menu item is disabled.
 */
export const MultipleOperationsWithPicker: Story = {
  args: {
    transportMethod: 'GET',
    operations: opsOf(
      [
        'query Alpha { widget { id } }',
        'query Beta { gadget { id } }',
        'mutation CreateWidget { createWidget { id } }',
      ].join('\n\n'),
    ),
    operationName: 'Beta',
    onSetOperationName() {},
  },
};

/** An override pins the operation, so no picker appears despite several operations. */
export const OverriddenOperation: Story = {
  args: {
    operations: opsOf(
      'query Alpha { widget { id } }\nquery Beta { gadget { id } }',
    ),
    overrideOperationName: 'Alpha',
  },
};

/** GET selected with a mutation active: the button is disabled and explains why on hover. */
export const BlockedOverGet: Story = {
  args: {
    transportMethod: 'GET',
    operations: opsOf('mutation CreateWidget { createWidget { id } }'),
    runDisabledReason: 'Mutations can only be sent via POST',
  },
};

/** A request in flight: the button becomes Stop, and the picker is hidden. */
export const Running: Story = {
  args: {
    isFetching: true,
    operations: opsOf(
      'query Alpha { widget { id } }\nquery Beta { gadget { id } }',
    ),
  },
};

/** An active subscription holds the button in its stop state. */
export const Subscribed: Story = {
  args: {
    isSubscribed: true,
    operations: opsOf('subscription OnWidget { widgetAdded { id } }'),
  },
};
