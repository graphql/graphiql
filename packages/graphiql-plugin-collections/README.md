# @graphiql/plugin-collections

A first-party operation collections plugin for GraphiQL. Save named GraphQL operations into collections and reuse them later, with drag-and-drop reordering, clipboard sharing, and JSON import/export that merges by id instead of duplicating.

## Installation

```sh
npm install @graphiql/plugin-collections
```

Make sure the peer dependencies are installed too:

```sh
npm install react react-dom graphql @graphiql/react
```

## Usage

The collections plugin is installed by default in GraphiQL, so an unmodified `<GraphiQL>` already shows a Collections rail icon. You only need to register it explicitly to configure it, for example to supply a custom storage backend or restrict what users can do.

> **Note:** passing the `plugins` prop replaces the default plugin set, so include the others you want alongside it.

```jsx
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import { collectionsPlugin } from '@graphiql/plugin-collections';
import 'graphiql/style.css';
import '@graphiql/plugin-collections/style.css';

const transport = createTransport({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

const collections = collectionsPlugin();

function GraphiQLWithCollections() {
  return <GraphiQL transport={transport} plugins={[collections]} />;
}
```

## Options

```ts
collectionsPlugin({
  storage, // custom persistence backend; see below
  readOnly, // default false
  allowImportExport, // default true
  allowReplace, // default true
  allowCopy, // default true
});
```

| Option              | Default              | Effect                                                                                                                                 |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`           | localStorage adapter | A custom `CollectionsStorage` (see [Custom storage](#custom-storage)).                                                                 |
| `readOnly`          | `false`              | Hides every write affordance (create, rename, delete, reorder, save, import). Export and copy stay available so users can still share. |
| `allowImportExport` | `true`               | When `false`, hides the import/export dialog button and turns off paste/drop import.                                                   |
| `allowReplace`      | `true`               | When `false`, hides the destructive "replace everything" import mode and leaves only merge.                                            |
| `allowCopy`         | `true`               | When `false`, hides the "Copy to clipboard" and "Copy operation" actions.                                                              |

## Import and merge behavior

Collections and the operations inside them carry stable UUIDs that survive export and import. On import, the plugin reconciles by id instead of duplicating:

- A new operation is added. An operation you already have is updated in place wherever you keep it, even if you've moved it to a different collection. A missing parent collection is recreated.
- Re-importing an unchanged export does nothing, so you never get duplicates.
- When an incoming operation differs from your local copy, a dialog lets you apply the changes, keep your versions, or review each operation one at a time. Merge never deletes.

An operation can also be shared on its own with "Copy operation". It travels as a one-item collection envelope stamped with its parent collection, so the recipient can re-home it on import.

## Custom storage

Persistence is pluggable through the `CollectionsStorage` interface:

```ts
type CollectionsStorage = {
  storageKey?: string;
  load(): Promise<Collection[]>;
  save(collections: Collection[]): Promise<void>;
};
```

The default writes to `localStorage` under the key `graphiql:collections`. To use a different key, pass an adapter from the exported `createLocalStorageAdapter` factory:

```ts
import {
  collectionsPlugin,
  createLocalStorageAdapter,
} from '@graphiql/plugin-collections';

const collections = collectionsPlugin({
  storage: createLocalStorageAdapter('my-key'),
});
```

To back collections with your own service (REST, a database, a team-shared store), implement the interface and pass it as `storage`:

```ts
import { collectionsPlugin } from '@graphiql/plugin-collections';
import type {
  Collection,
  CollectionsStorage,
} from '@graphiql/plugin-collections';

const apiStorage: CollectionsStorage = {
  async load() {
    const res = await fetch('/api/collections');
    return (await res.json()) as Collection[];
  },
  async save(collections) {
    await fetch('/api/collections', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(collections),
    });
  },
};

const collections = collectionsPlugin({ storage: apiStorage });
```

`load()` runs once when the panel first mounts. `save()` runs after every mutation with the full collection list.

### Team-shared backends and sync

The plugin has no opinion about conflict resolution or synchronization; that lives in your storage adapter. Because every operation and collection has a stable id, your adapter can diff successive `save()` snapshots and reconcile them however it needs to, whether that is a plain backend write, a last-write-wins policy, or a CRDT such as Yjs or Automerge. The plugin itself stays a CRUD UI over a serializable model.

The plugin does not react to remote changes on its own. When your backend reports an external change, call `reload()` to re-read storage and refresh the UI:

```ts
import { collectionsStore } from '@graphiql/plugin-collections';

await collectionsStore.getState().actions.reload();
```

## Programmatic access

The store and its React hook are exported for programmatic access:

```ts
import {
  collectionsStore, // the vanilla zustand store
  useCollectionsStore, // React hook: useCollectionsStore(selector)
} from '@graphiql/plugin-collections';

const { actions } = collectionsStore.getState();

// Replace the in-memory collections (e.g. after merging remote state).
// Does NOT write back to storage.
actions.setCollections(nextCollections);

// Re-read from the configured storage and refresh the UI.
await actions.reload();
```

`actions` also exposes the full CRUD surface (`createCollection`, `addItem`, `updateItem`, `deleteItem`, `moveItem`, `renameCollection`, and so on) plus `exportCollections` / `exportCollection` / `exportItem` and the two-phase `analyzeImport` / `applyImport`.

## Exports

- `collectionsPlugin(options?)` — the plugin factory
- `collectionsStore`, `useCollectionsStore` — the store and its React hook
- `createLocalStorageAdapter(key)`, `localStorageAdapter` — built-in storage
- `CollectionsSaveDialog` — the save dialog component
- Types: `Collection`, `CollectionItem`, `CollectionsStorage`, `CollectionsConfig`, `ActiveOperation`
