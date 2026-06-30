# @graphiql/plugin-collections

A first-party operation collections plugin for GraphiQL. Save, organize, and
reuse named GraphQL operations in named collections, with drag-and-drop reorder,
clipboard sharing, and identity-aware JSON import/export.

## Installation

```sh
npm install @graphiql/plugin-collections
```

Make sure the peer dependencies are installed too:

```sh
npm install react react-dom graphql @graphiql/react
```

## Usage

The collections plugin is **installed by default** in GraphiQL, so an unmodified
`<GraphiQL>` already shows a Collections rail icon. You only need to register it
explicitly when you want to configure it — for example to supply a custom storage
backend or to restrict what users can do.

> **Note:** passing the `plugins` prop replaces the default plugin set, so
> include the others you want alongside it.

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

| Option              | Default              | Effect                                                                                                                                                     |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`           | localStorage adapter | A custom `CollectionsStorage` (see [Custom storage](#custom-storage)).                                                                                     |
| `readOnly`          | `false`              | Hides all write affordances — creating, renaming, deleting, reordering, saving, and importing. Export and copy remain available, so users can still share. |
| `allowImportExport` | `true`               | When `false`, hides the import/export dialog button and disables paste/drop import entirely.                                                               |
| `allowReplace`      | `true`               | When `false`, hides the destructive "replace everything" import mode, leaving only merge.                                                                  |
| `allowCopy`         | `true`               | When `false`, hides the "Copy to clipboard" / "Copy operation" actions.                                                                                    |

All options are backward compatible — with none passed, behavior is unchanged.

## Import & merge behavior

Collections and the operations inside them carry stable UUIDs that are preserved
across export and import. On import, the plugin reconciles **by id** rather than
duplicating:

- A new operation is added; an operation you already have is **updated in place**
  wherever you keep it (even if you've moved it to a different collection); a
  missing parent collection is recreated.
- Re-importing an unchanged export is a no-op — no duplicates.
- When an incoming operation's content differs from your local copy, a dialog
  lets you **apply the changes**, **keep your versions**, or **review each**
  operation individually. Merge never deletes.

An operation can be shared on its own ("Copy operation"); it travels as a
one-item collection envelope stamped with its parent collection, so the
recipient can re-home it on import.

## Custom storage

Persistence is pluggable through the `CollectionsStorage` interface:

```ts
type CollectionsStorage = {
  storageKey?: string;
  load(): Promise<Collection[]>;
  save(collections: Collection[]): Promise<void>;
};
```

The default writes to `localStorage` under the key `graphiql:collections`. To use
a different key, build an adapter with `createLocalStorageAdapter('my-key')`. To
back collections with your own service (REST, a database, a team-shared store),
implement the interface and pass it as `storage`:

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

`load()` is called once when the panel first mounts; `save()` is called after
every mutation with the full collection list.

### Team-shared backends and sync

The plugin deliberately keeps no opinion about conflict resolution or
synchronization — that lives in your storage adapter. Because every operation and
collection has a stable id, an adapter can diff successive `save()` snapshots by
id and feed a backend, a last-write-wins policy, or a CRDT (e.g. Yjs/Automerge)
without the plugin needing to know. Convergence is the adapter's concern; the
plugin stays a plain CRUD UI over a serializable model.

There is no automatic reactivity to remote changes. When your backend reports an
external change, call `reload()` (below) to re-read storage and refresh the UI:

```ts
import { collectionsStore } from '@graphiql/plugin-collections';

await collectionsStore.getState().actions.reload();
```

## Programmatic access

The store and a bound React hook are exported for advanced integrations:

```ts
import {
  collectionsStore, // the vanilla zustand store
  useCollectionsStore, // bound hook: useCollectionsStore(selector)
} from '@graphiql/plugin-collections';

const { actions } = collectionsStore.getState();

// Replace the in-memory collections (e.g. after merging remote state).
// Does NOT write back to storage.
actions.setCollections(nextCollections);

// Re-read from the configured storage and refresh the UI.
await actions.reload();
```

`actions` also exposes the full CRUD surface (`createCollection`, `addItem`,
`updateItem`, `deleteItem`, `moveItem`, `renameCollection`, …) plus
`exportCollections` / `exportCollection` / `exportItem` and the two-phase
`analyzeImport` / `applyImport`.

## Exports

- `collectionsPlugin(options?)` — the plugin factory
- `collectionsStore`, `useCollectionsStore` — store and bound hook
- `createLocalStorageAdapter(key)`, `localStorageAdapter` — built-in storage
- `CollectionsSaveDialog` — the save dialog component
- Types: `Collection`, `CollectionItem`, `CollectionsStorage`,
  `CollectionsConfig`, `ActiveOperation`
