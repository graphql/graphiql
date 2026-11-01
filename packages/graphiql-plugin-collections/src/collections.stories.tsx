import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphiQLProvider, Tooltip } from '@graphiql/react';
import { CollectionRow } from './components/collection-row';
import { CollectionItemRow } from './components/collection-item-row';
import { SaveDialog } from './components/save-dialog';
import { ConflictDialog } from './components/conflict-dialog';
import { collectionsStore } from './store';
import type { Collection, CollectionItem, ImportAnalysis } from './types';
import './index.css';

// ---------------------------------------------------------------------------
// Shared decorator: collections components need GraphiQLProvider + Tooltip
// ---------------------------------------------------------------------------

function withCollectionsContext(children: ReactNode) {
  return (
    <Tooltip.Provider>
      <GraphiQLProvider
        transport={{
          url: 'https://example.com/graphql',
          method: 'POST' as const,
          supportedMethods: ['POST' as const],
          send: async () => ({
            ok: true,
            body: { data: {} },
            timing: { totalMs: 0 },
            size: {},
          }),
        }}
      >
        <div style={{ width: 320, background: 'oklch(var(--bg-elevated))' }}>
          {children}
        </div>
      </GraphiQLProvider>
    </Tooltip.Provider>
  );
}

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const now = Date.now();

const queryItem: CollectionItem = {
  id: 'item-qry-1',
  name: 'Get User',
  query: 'query GetUser($id: ID!) { user(id: $id) { id name email } }',
  variables: JSON.stringify({ id: '123' }),
  description: 'Fetch a user by ID.',
  createdAt: now,
  updatedAt: now,
};

const mutationItem: CollectionItem = {
  id: 'item-mut-1',
  name: 'Create Post',
  query:
    'mutation CreatePost($input: PostInput!) { createPost(input: $input) { id } }',
  createdAt: now,
  updatedAt: now,
};

const subscriptionItem: CollectionItem = {
  id: 'item-sub-1',
  name: 'On Comment Added',
  query: 'subscription OnCommentAdded { commentAdded { id body } }',
  createdAt: now,
  updatedAt: now,
};

const mixItem: CollectionItem = {
  id: 'item-mix-1',
  name: 'Multi-op document',
  query:
    'query GetUser { user { id } }\nmutation UpdateUser($id: ID!) { updateUser(id: $id) { id } }',
  createdAt: now,
  updatedAt: now,
};

const sampleCollection: Collection = {
  id: 'col-1',
  name: 'User Operations',
  createdAt: now,
  updatedAt: now,
  items: [queryItem, mutationItem, subscriptionItem],
};

const secondCollection: Collection = {
  id: 'col-2',
  name: 'Comments',
  createdAt: now,
  updatedAt: now,
  items: [mixItem],
};

// No-op callbacks used by all item/row stories.
const noopOpen = (_item: CollectionItem) => {};
const noopShare = async (_id: string) => {};
const noopAnnounce = (_msg: string) => {};
const noopDelete = (_colId: string, _itemId: string) => {};
const noopMove = (
  _fromCol: string,
  _fromIdx: number,
  _toCol: string,
  _toIdx: number,
) => {};
const noopRenameItem = (
  _colId: string,
  _itemId: string,
  _updates: { name: string; description: string },
) => {};
const noopGrabToggle = () => {};
const noopGrabMove = (_dir: 'up' | 'down') => {};
const noopGrabCancel = () => {};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Plugins/Collections',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
// MethodPill variants via CollectionItemRow
// ---------------------------------------------------------------------------

export const MethodPillQuery: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionItemRow
        item={queryItem}
        collectionId="col-1"
        index={0}
        isGrabbed={false}
        onGrabToggle={noopGrabToggle}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onOpen={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDelete={noopDelete}
        onMove={noopMove}
        onRenameItem={noopRenameItem}
      />,
    ),
};

export const MethodPillMutation: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionItemRow
        item={mutationItem}
        collectionId="col-1"
        index={0}
        isGrabbed={false}
        onGrabToggle={noopGrabToggle}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onOpen={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDelete={noopDelete}
        onMove={noopMove}
        onRenameItem={noopRenameItem}
      />,
    ),
};

export const MethodPillSubscription: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionItemRow
        item={subscriptionItem}
        collectionId="col-1"
        index={0}
        isGrabbed={false}
        onGrabToggle={noopGrabToggle}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onOpen={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDelete={noopDelete}
        onMove={noopMove}
        onRenameItem={noopRenameItem}
      />,
    ),
};

export const MethodPillMix: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionItemRow
        item={mixItem}
        collectionId="col-1"
        index={0}
        isGrabbed={false}
        onGrabToggle={noopGrabToggle}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onOpen={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDelete={noopDelete}
        onMove={noopMove}
        onRenameItem={noopRenameItem}
      />,
    ),
};

// ---------------------------------------------------------------------------
// CollectionRow — collapsed (default) and expanded
// ---------------------------------------------------------------------------

export const CollectionCollapsed: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionRow
        collection={sampleCollection}
        expanded={false}
        onToggleExpand={() => {}}
        grabbed={null}
        onGrabToggle={() => {}}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onRename={() => {}}
        onDelete={() => {}}
        onShareCollection={noopShare}
        onOpenItem={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDeleteItem={noopDelete}
        onMoveItem={noopMove}
        onAddItem={(_colId, item) => ({
          ...item,
          id: 'new',
          createdAt: now,
          updatedAt: now,
        })}
        onRenameItem={noopRenameItem}
      />,
    ),
};

export const CollectionExpanded: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionRow
        collection={sampleCollection}
        expanded
        onToggleExpand={() => {}}
        grabbed={null}
        onGrabToggle={() => {}}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onRename={() => {}}
        onDelete={() => {}}
        onShareCollection={noopShare}
        onOpenItem={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDeleteItem={noopDelete}
        onMoveItem={noopMove}
        onAddItem={(_colId, item) => ({
          ...item,
          id: 'new',
          createdAt: now,
          updatedAt: now,
        })}
        onRenameItem={noopRenameItem}
      />,
    ),
};

// ---------------------------------------------------------------------------
// Two collections expanded — exercises the full tree / panel-like view
// ---------------------------------------------------------------------------

export const TwoCollectionsExpanded: Story = {
  render: () =>
    withCollectionsContext(
      <>
        <CollectionRow
          collection={sampleCollection}
          expanded
          onToggleExpand={() => {}}
          grabbed={null}
          onGrabToggle={() => {}}
          onGrabMove={noopGrabMove}
          onGrabCancel={noopGrabCancel}
          onRename={() => {}}
          onDelete={() => {}}
          onShareCollection={noopShare}
          onOpenItem={noopOpen}
          onShare={noopShare}
          onAnnounce={noopAnnounce}
          onDeleteItem={noopDelete}
          onMoveItem={noopMove}
          onAddItem={(_colId, item) => ({
            ...item,
            id: 'new',
            createdAt: now,
            updatedAt: now,
          })}
          onRenameItem={noopRenameItem}
        />
        <CollectionRow
          collection={secondCollection}
          expanded
          onToggleExpand={() => {}}
          grabbed={null}
          onGrabToggle={() => {}}
          onGrabMove={noopGrabMove}
          onGrabCancel={noopGrabCancel}
          onRename={() => {}}
          onDelete={() => {}}
          onShareCollection={noopShare}
          onOpenItem={noopOpen}
          onShare={noopShare}
          onAnnounce={noopAnnounce}
          onDeleteItem={noopDelete}
          onMoveItem={noopMove}
          onAddItem={(_colId, item) => ({
            ...item,
            id: 'new',
            createdAt: now,
            updatedAt: now,
          })}
          onRenameItem={noopRenameItem}
        />
      </>,
    ),
};

// ---------------------------------------------------------------------------
// Empty collection (expanded — shows the empty-hint text)
// ---------------------------------------------------------------------------

const emptyCollection: Collection = {
  id: 'col-empty',
  name: 'Empty Collection',
  createdAt: now,
  updatedAt: now,
  items: [],
};

export const CollectionEmpty: Story = {
  render: () =>
    withCollectionsContext(
      <CollectionRow
        collection={emptyCollection}
        expanded
        onToggleExpand={() => {}}
        grabbed={null}
        onGrabToggle={() => {}}
        onGrabMove={noopGrabMove}
        onGrabCancel={noopGrabCancel}
        onRename={() => {}}
        onDelete={() => {}}
        onShareCollection={noopShare}
        onOpenItem={noopOpen}
        onShare={noopShare}
        onAnnounce={noopAnnounce}
        onDeleteItem={noopDelete}
        onMoveItem={noopMove}
        onAddItem={(_colId, item) => ({
          ...item,
          id: 'new',
          createdAt: now,
          updatedAt: now,
        })}
        onRenameItem={noopRenameItem}
      />,
    ),
};

// ---------------------------------------------------------------------------
// SaveDialog — open with an operation pre-filled
// ---------------------------------------------------------------------------

export const SaveDialogOpen: Story = {
  render() {
    collectionsStore.setState({
      collections: [sampleCollection],
      loaded: true,
    });
    collectionsStore.getState().actions.openSaveDialog({
      name: 'GetUser',
      query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
      variables: JSON.stringify({ id: '1' }),
      headers: '',
    });
    return withCollectionsContext(<SaveDialog />);
  },
};

// ---------------------------------------------------------------------------
// ConflictDialog — summary state (N new / M changed / K unchanged)
// ---------------------------------------------------------------------------

const conflictAnalysis: ImportAnalysis = {
  ok: true,
  newCollections: [],
  newItems: [
    {
      item: {
        id: 'item-new-1',
        name: 'New Operation',
        query: '{ newField }',
        createdAt: now,
        updatedAt: now,
      },
      targetCollectionId: 'col-1',
    },
    {
      item: {
        id: 'item-new-2',
        name: 'Another New Op',
        query: 'mutation DoThing { doThing }',
        createdAt: now,
        updatedAt: now,
      },
      targetCollectionId: 'col-1',
    },
  ],
  changedItems: [
    {
      incoming: {
        id: queryItem.id,
        name: queryItem.name,
        query: 'query GetUser($id: ID!) { user(id: $id) { id name role } }',
        createdAt: queryItem.createdAt,
        updatedAt: queryItem.updatedAt + 3_600_000,
      },
      current: queryItem,
      currentCollectionId: 'col-1',
    },
  ],
  unchangedCount: 3,
  _incoming: [],
};

export const ConflictDialogSummary: Story = {
  render() {
    collectionsStore.setState({
      collections: [sampleCollection],
      loaded: true,
    });
    return withCollectionsContext(
      <ConflictDialog
        analysis={conflictAnalysis}
        sourceLabel="team-ops.json"
        open
        onClose={() => {}}
        onResolve={() => {}}
      />,
    );
  },
};
