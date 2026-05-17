import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GraphiQLProvider,
  Tooltip,
  PanelHeader,
  Button,
} from '@graphiql/react';
import { History, HistoryItem } from './components';
import { HistoryStore } from './context';
import './style.css';

// ---------------------------------------------------------------------------
// Shared decorator: History items need GraphiQLProvider + HistoryStore
// ---------------------------------------------------------------------------

function withHistoryContext(children: ReactNode) {
  return (
    <Tooltip.Provider>
      <GraphiQLProvider fetcher={() => Promise.resolve({ data: {} })}>
        <HistoryStore>
          <div style={{ width: 320, background: 'oklch(var(--bg-elevated))' }}>
            {children}
          </div>
        </HistoryStore>
      </GraphiQLProvider>
    </Tooltip.Provider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Plugins/History',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
// PanelHeader (no context required)
// ---------------------------------------------------------------------------

export const Header: Story = {
  render: () => (
    <div style={{ width: 320, background: 'oklch(var(--bg-elevated))' }}>
      <PanelHeader
        title="History"
        subtitle="Last 20 runs. ⌥-click a row to diff."
        actions={
          <Button type="button" disabled>
            Clear
          </Button>
        }
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Single item — query only
// ---------------------------------------------------------------------------

export const ItemQueryOnly: Story = {
  render: () =>
    withHistoryContext(
      <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
        <HistoryItem
          item={{
            query: 'query GetUser { user { id name email } }',
            favorite: false,
          }}
        />
      </ul>,
    ),
};

// ---------------------------------------------------------------------------
// Single item — with variables snippet
// ---------------------------------------------------------------------------

export const ItemWithVariables: Story = {
  render: () =>
    withHistoryContext(
      <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
        <HistoryItem
          item={{
            query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
            variables: JSON.stringify({ id: '123', role: 'admin' }),
            operationName: 'GetUser',
            favorite: false,
          }}
        />
      </ul>,
    ),
};

// ---------------------------------------------------------------------------
// Favorited item
// ---------------------------------------------------------------------------

export const ItemFavorited: Story = {
  render: () =>
    withHistoryContext(
      <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
        <HistoryItem
          item={{
            query: 'query Me { viewer { login avatarUrl } }',
            operationName: 'Me',
            favorite: true,
          }}
        />
      </ul>,
    ),
};

// ---------------------------------------------------------------------------
// Custom label
// ---------------------------------------------------------------------------

export const ItemWithLabel: Story = {
  render: () =>
    withHistoryContext(
      <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
        <HistoryItem
          item={{
            query: 'query { repositories { totalCount } }',
            label: 'Repo count check',
            favorite: false,
          }}
        />
      </ul>,
    ),
};

// ---------------------------------------------------------------------------
// Empty state (full History component)
// ---------------------------------------------------------------------------

export const Empty: Story = {
  render: () => withHistoryContext(<History />),
};

// ---------------------------------------------------------------------------
// Few rows
// ---------------------------------------------------------------------------

export const FewRows: Story = {
  render: () =>
    withHistoryContext(
      <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
        <HistoryItem
          item={{
            query: 'query Me { viewer { login } }',
            operationName: 'Me',
            favorite: false,
          }}
        />
        <HistoryItem
          item={{
            query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
            variables: JSON.stringify({ id: '42' }),
            operationName: 'GetUser',
            favorite: false,
          }}
        />
        <HistoryItem
          item={{
            query: 'mutation CreatePost($input: PostInput!) { createPost(input: $input) { id } }',
            variables: JSON.stringify({ input: { title: 'Hello', body: 'World' } }),
            operationName: 'CreatePost',
            favorite: false,
          }}
        />
      </ul>,
    ),
};

// ---------------------------------------------------------------------------
// Many rows
// ---------------------------------------------------------------------------

const manyItems = Array.from({ length: 10 }, (_, i) => ({
  query: `query Query${i + 1} { node(id: "${i + 1}") { id ... on User { name } } }`,
  operationName: `Query${i + 1}`,
  favorite: false,
}));

export const ManyRows: Story = {
  render: () =>
    withHistoryContext(
      <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
        {manyItems.map(item => (
          <HistoryItem key={item.operationName} item={item} />
        ))}
      </ul>,
    ),
};

// ---------------------------------------------------------------------------
// Mixed: favorites + regular + with variables
// ---------------------------------------------------------------------------

export const Mixed: Story = {
  render: () =>
    withHistoryContext(
      <>
        <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
          <HistoryItem
            item={{
              query: 'query Me { viewer { login avatarUrl } }',
              operationName: 'Me',
              favorite: true,
              label: 'My profile',
            }}
          />
          <HistoryItem
            item={{
              query: 'subscription OnComment { commentAdded { id body } }',
              operationName: 'OnComment',
              favorite: true,
            }}
          />
        </ul>
        <div className="graphiql-history-item-spacer" />
        <ul className="graphiql-history-items" style={{ padding: 0, margin: 0 }}>
          <HistoryItem
            item={{
              query: 'query GetUser($id: ID!) { user(id: $id) { id name email } }',
              variables: JSON.stringify({ id: '123', role: 'admin' }),
              operationName: 'GetUser',
              favorite: false,
            }}
          />
          <HistoryItem
            item={{
              query: 'mutation DeleteUser($id: ID!) { deleteUser(id: $id) }',
              operationName: 'DeleteUser',
              favorite: false,
            }}
          />
          <HistoryItem
            item={{
              query: '{ __typename }',
              favorite: false,
            }}
          />
        </ul>
      </>,
    ),
};
