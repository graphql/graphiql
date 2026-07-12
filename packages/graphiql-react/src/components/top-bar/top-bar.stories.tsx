import type { Meta, StoryObj } from '@storybook/react-vite';
import type { HttpMethod } from '@graphiql/toolkit';
import { parse, OperationDefinitionNode } from 'graphql';
import { GraphiQLProvider } from '../provider';
import { TopBar, TopBarView } from './';
import { Tooltip } from '../tooltip';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const postOnlyTransport = {
  url: 'https://api.example.com/graphql',
  method: 'POST' as const,
  supportedMethods: ['POST' as const],
  send: async () => ({
    ok: true,
    body: { data: {} },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const switchableTransport: {
  url: string;
  method: HttpMethod;
  supportedMethods: HttpMethod[];
  setMethod(method: HttpMethod): void;
  send: () => Promise<{
    ok: boolean;
    body: { data: Record<string, never> };
    timing: { totalMs: number };
    size: Record<string, never>;
  }>;
} = {
  url: 'https://api.example.com/graphql',
  method: 'POST',
  supportedMethods: ['GET', 'POST', 'QUERY'],
  setMethod(method: HttpMethod) {
    switchableTransport.method = method;
  },
  send: async () => ({
    ok: true,
    body: { data: {} },
    timing: { totalMs: 0 },
    size: {},
  }),
};

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TopBar>;

/** POST-only transport: static method label, no switcher. */
export const Default: Story = {
  args: { version: 'v6.0.0-alpha.1' },
  decorators: [
    Story => (
      <Tooltip.Provider>
        <GraphiQLProvider transport={postOnlyTransport}>
          <Story />
        </GraphiQLProvider>
      </Tooltip.Provider>
    ),
  ],
};

/** GET/POST-capable transport: click-to-toggle method chip with tooltip. */
export const WithMethodSwitcher: Story = {
  args: { version: 'v6.0.0-alpha.1' },
  decorators: [
    Story => (
      <Tooltip.Provider>
        <GraphiQLProvider transport={switchableTransport}>
          <Story />
        </GraphiQLProvider>
      </Tooltip.Provider>
    ),
  ],
};

/** No version pill. */
export const NoVersion: Story = {
  args: {},
  decorators: [
    Story => (
      <Tooltip.Provider>
        <GraphiQLProvider transport={postOnlyTransport}>
          <Story />
        </GraphiQLProvider>
      </Tooltip.Provider>
    ),
  ],
};

/** GET selected with a mutation in the editor: Run disabled, method toggle highlighted. */
export const MutationBlockedOverGet: Story = {
  render: () => (
    <Tooltip.Provider>
      <TopBarView
        version="v6.0.0-alpha.1"
        isFetching={false}
        url="https://api.example.com/graphql"
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can only be sent via POST"
        onRun={() => {}}
        onSetMethod={() => {}}
      />
    </Tooltip.Provider>
  ),
};

/**
 * A single operation: the Run button is a plain pill, no caret and no
 * active-operation label (naming your only operation is redundant).
 */
export const SingleOperationNoCaret: Story = {
  render: () => (
    <Tooltip.Provider>
      <TopBarView
        version="v6.0.0-alpha.1"
        isFetching={false}
        url="https://api.example.com/graphql"
        method="POST"
        supportedMethods={['POST']}
        operations={opsOf('query GetWidget { widget { id } }')}
        operationName={null}
        onRun={() => {}}
        onSetMethod={() => {}}
      />
    </Tooltip.Provider>
  ),
};

/**
 * Several named operations: the Run button grows a caret opening the
 * operation picker, and the currently active operation is named beside it.
 * GET is selected, so the mutation's menu item is disabled.
 */
export const MultipleOperationsWithPicker: Story = {
  render: () => (
    <Tooltip.Provider>
      <TopBarView
        version="v6.0.0-alpha.1"
        isFetching={false}
        url="https://api.example.com/graphql"
        method="GET"
        supportedMethods={['GET', 'POST']}
        transportMethod="GET"
        operations={opsOf(
          [
            'query Alpha { widget { id } }',
            'query Beta { gadget { id } }',
            'mutation CreateWidget { createWidget { id } }',
          ].join('\n\n'),
        )}
        operationName="Beta"
        onRun={() => {}}
        onSetMethod={() => {}}
        onSetOperationName={() => {}}
      />
    </Tooltip.Provider>
  ),
};
