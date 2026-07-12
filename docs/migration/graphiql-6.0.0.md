# Upgrading `graphiql` to `6.0.0`

GraphiQL 6 is a visual redesign built on a new OKLCH color system, plus a handful of mostly additive API changes: a `Transport` API that sits alongside the existing `Fetcher`, a settings dialog for theme/density/font-size, and two new first-party plugins (a visual query builder and operation collections) installed by default. The one breaking change is that the hooks deprecated in v5 are now removed, each with a drop-in replacement. See [discussion #4219](https://github.com/graphql/graphiql/discussions/4219) for the design background and to leave feedback.

If something in your integration breaks that isn't covered here, please open an issue and we'll add it.

## Contents

1. [Overview](#overview)
2. [CSS and retheming](#css-and-retheming)
3. [Removed hooks](#removed-hooks)
4. [New `transport` prop](#new-transport-prop)
5. [New first-party plugins](#new-first-party-plugins)
6. [`@graphiql/plugin-explorer` removal](#graphiqlplugin-explorer-removal)
7. [Theme, density, and font-size settings](#theme-density-and-font-size-settings)
8. [Considering for removal in v7](#considering-for-removal-in-v7)
9. [Other notes](#other-notes)

## Overview

Visually, v6 introduces a new OKLCH-based design-token system, restyles every primitive component (buttons, dialogs, tabs, dropdowns, tooltips), and reworks the app chrome around a top bar, an activity rail, and a side panel. Functionally, the biggest changes are a new `Transport` API for the network layer, the active operation following your cursor instead of only updating on run, and two new default-installed plugins: a visual query builder and operation collections.

Most of this is additive and requires no rewrite: the old `fetcher` prop and the old CSS variables keep working. The one breaking change to watch for is the removal of the hooks that were deprecated back in v5 (`useEditorContext`, `usePluginContext`, and the rest). Each has a direct replacement, covered below. Read the sections relevant to your setup and treat the rest as optional cleanup.

## CSS and retheming

If you don't override GraphiQL's CSS, there's nothing to do here — the new look applies automatically.

If you do retheme GraphiQL by overriding CSS custom properties, the important thing to understand is that v6 does **not** replace the old variables with new ones of the same name — it adds a second, parallel token system and **deprecates the old one**. The v5 variables (`--color-primary`, `--color-neutral`, `--color-base`, and so on, defined under `.graphiql-container` as `h, s%, l%` triplets consumed via `hsl(var(--x))`) are still defined, frozen at their v5 values, but **no v6 component reads them anymore** — every restyled surface reads a new set of OKLCH tokens in `tokens.css` instead. They're retained only as a frozen compatibility surface for your own custom CSS — no first-party code reads them.

Practically, that means:

- **Overriding a `--color-*` variable no longer re-themes GraphiQL's built-in UI.** The variables still resolve, so custom CSS of your own that reads them won't break, but because no component reads them, setting `--color-primary` or `--color-neutral` has no effect on the redesigned surfaces. To retheme v6, set the OKLCH tokens instead.
- **There is no automatic conversion** between the two systems, and no compatibility shim. The formats differ — v5 packs `h, s%, l%` for `hsl()`, v6 packs `L% C H` for `oklch()` — so an old variable can't simply alias a new one. See [Migrating `--color-*` overrides](#migrating---color--overrides) below.

### The new variable names

The new tokens are stored as `L% C H` component triplets (lightness percent, chroma, hue), consumed via `oklch(var(--x))`, so you can layer opacity at the call site with `oklch(var(--fg-default) / 0.6)` instead of needing a separate alpha variable per color. They're scoped to `[data-theme='dark']` and `[data-theme='light']` rather than a media query, so a value applies regardless of which theme is active. The full set, defined in `tokens.css`:

- **Backgrounds:** `--bg-canvas`, `--bg-elevated`, `--bg-subtle`, `--bg-overlay`
- **Borders:** `--border-default`, `--border-muted`, `--border-strong`
- **Foreground:** `--fg-default`, `--fg-strong`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`, `--fg-dim`
- **Accents:** `--accent-blue`, `--accent-green`, `--accent-green-light`, `--accent-yellow`, `--accent-orange`, `--accent-red`, `--accent-purple`, `--accent-pink`
- **Type-name categories:** `--type-composite`, `--type-scalar`, `--type-enum`, `--type-input`
- **Run button:** `--btn-primary`, `--btn-primary-border`
- **Radii:** `--radius-sm`, `--radius-md`, `--radius-lg`
- **Shadow:** `--shadow-popover`

There is no published mapping from the nine v5 `--color-*` names to these — the two palettes aren't a 1:1 redesign of each other. Some v5 roles split into several v6 tokens (one `--color-base` background becomes four: `--bg-canvas`, `--bg-elevated`, `--bg-subtle`, `--bg-overlay`), and v6 introduces categories v5 didn't have at all, like a three-step border scale and a dedicated `--fg-disabled` / `--fg-dim` pair for de-emphasized text. If you have a bespoke theme, treat the new token list as a fresh design surface to map your brand colors onto rather than a mechanical find-and-replace of the old one.

The v5 variables are still documented in the [`@graphiql/react` README](../../packages/graphiql-react/README.md#theming); the new token file itself, [`tokens.css`](../../packages/graphiql-react/src/style/tokens.css), is the source of truth for the v6 set until the README catches up.

### Migrating `--color-*` overrides

There's no mechanical 1:1 replacement — a single v5 variable often split across several v6 tokens depending on the surface, and which token you want depends on what you're theming. As a starting point, here's where GraphiQL's own internal usages of each v5 variable moved to:

| v5 variable                                             | Role                                    | v6 token(s) GraphiQL now uses                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-base`                                          | Surfaces / backgrounds                  | `--bg-canvas` (page), `--bg-elevated` (menus/popovers), `--bg-subtle` (inputs, resting fills), `--bg-overlay` (hover)                                                                    |
| `--color-neutral`                                       | Body text, icons, borders, subtle fills | Text: `--fg-default` (default), `--fg-muted` (secondary), `--fg-subtle` (icons); borders: `--border-default`, `--border-strong`; translucent fills: `oklch(var(--fg-default) / <alpha>)` |
| `--color-primary`                                       | Links, primary accent                   | `--accent-blue` (links, accent text/icons); `--btn-primary` + `--btn-primary-border` (filled action buttons)                                                                             |
| `--color-warning`                                       | Deprecation / warning                   | `--accent-orange` (text/border; `oklch(var(--accent-orange) / 0.1)` for fills)                                                                                                           |
| `--color-error`                                         | Errors                                  | `--accent-red`                                                                                                                                                                           |
| `--color-success`                                       | Success                                 | `--accent-green`                                                                                                                                                                         |
| `--color-secondary`, `--color-tertiary`, `--color-info` | Secondary accents, editor syntax        | The `--accent-*` set in `tokens.css`; editor syntax colors are defined in the Monaco theme, not via CSS variables                                                                        |

Remember these are OKLCH triplets composed with `oklch(var(--x))` (and `oklch(var(--x) / <alpha>)` for transparency), not `hsl()`/`hsla()`.

### Type-name colors

In the schema-aware plugins — the doc explorer and the query builder — type-name references are colored by their GraphQL kind rather than all sharing one color. This makes a field list easier to scan: leaf types stand out from the objects you drill into.

| Kind                     | Token              | Default |
| ------------------------ | ------------------ | ------- |
| object, interface, union | `--type-composite` | orange  |
| scalar                   | `--type-scalar`    | blue    |
| enum                     | `--type-enum`      | green   |
| input object             | `--type-input`     | gold    |

These four `--type-*` tokens are the supported surface for retheming type-name colors. By default each aliases an accent token (`--type-scalar` resolves to `--accent-blue`, and so on), so you can retint either the accent or the `--type-*` token directly:

```css
[data-theme='dark'] {
  --type-scalar: 75% 0.15 200; /* recolor scalar type names */
}
```

If you're building your own plugin that renders type names and want it to match, `@graphiql/react` exports a `typeCategory(type)` helper that maps any GraphQL type to `'scalar' | 'enum' | 'input' | 'composite'` (unwrapping list and non-null wrappers). Apply the corresponding `--type-*` token to your markup; the attribute and class names GraphiQL uses internally are not part of the public API.

The Monaco query editor is not schema-aware — it can't tell a scalar from an object by name alone — so type names in the query text itself keep a single color. This categorization applies only to the schema-driven plugin UIs.

### Retheming example

To retint the accent color and canvas background for dark mode:

```css
[data-theme='dark'] {
  --accent-blue: 70% 0.16 250; /* brighter primary accent */
  --bg-canvas: 12% 0.02 260; /* darker canvas */
}
```

Because the selector is `[data-theme='dark']`, this overrides the built-in values regardless of load order, as long as it's not undone by a later stylesheet.

### Theme is now an attribute, not just a class

v5 toggled `body.graphiql-light` / `body.graphiql-dark` classes and a `prefers-color-scheme` media query. v6 introduces `data-theme="light"` / `data-theme="dark"` and gates the new token cascade on that attribute instead. The old `body.graphiql-*` classes are preserved for backwards compatibility — if you had custom CSS keyed off them, it still works — but if you were reading the theme from JavaScript by checking `document.body.classList`, consider switching to `useGraphiQLSettings()` (see [Theme, density, and font-size settings](#theme-density-and-font-size-settings)) or reading the `data-theme` attribute directly.

## Removed hooks

The following hooks were deprecated in v5 and are removed in v6. Importing or calling one is now a build error. Each has a direct replacement; swap in the right-hand column and the behavior stays the same.

| Removed                                     | Package                         | Replacement                                                     |
| ------------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `usePrettifyEditors`                        | `@graphiql/react`               | `const { prettifyEditors } = useGraphiQLActions()`              |
| `useCopyQuery`                              | `@graphiql/react`               | `const { copyQuery } = useGraphiQLActions()`                    |
| `useMergeQuery`                             | `@graphiql/react`               | `const { mergeQuery } = useGraphiQLActions()`                   |
| `useEditorContext` / `useEditorStore`       | `@graphiql/react`               | `useGraphiQL` + `useGraphiQLActions`                            |
| `useExecutionContext` / `useExecutionStore` | `@graphiql/react`               | `useGraphiQL` + `useGraphiQLActions`                            |
| `usePluginContext` / `usePluginStore`       | `@graphiql/react`               | `useGraphiQL` + `useGraphiQLActions`                            |
| `useSchemaContext` / `useSchemaStore`       | `@graphiql/react`               | `useGraphiQL` + `useGraphiQLActions`                            |
| `useStorageContext` / `useStorage`          | `@graphiql/react`               | `const storage = useGraphiQL(state => state.storage)`           |
| `useTheme`                                  | `@graphiql/react`               | `useGraphiQL` + `useGraphiQLActions` (or `useGraphiQLSettings`) |
| `useExplorerContext`                        | `@graphiql/plugin-doc-explorer` | `useDocExplorer` + `useDocExplorerActions`                      |
| `useHistoryContext`                         | `@graphiql/plugin-history`      | `useHistory` + `useHistoryActions`                              |

The pattern is the same everywhere: the old hook bundled a slice of state together with the actions that mutate it into one object. The replacement splits reads from writes — `useGraphiQL(selector)` for state, `useGraphiQLActions()` for the action creators — which lets a component that only calls an action skip re-rendering when unrelated state changes.

**Before:**

```tsx
import { usePluginContext } from '@graphiql/react';

function MyComponent() {
  const { plugins, visiblePlugin, setVisiblePlugin } = usePluginContext();
  return (
    <button onClick={() => setVisiblePlugin(plugins[0])}>
      {visiblePlugin?.title}
    </button>
  );
}
```

**After:**

```tsx
import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';

function MyComponent() {
  const plugins = useGraphiQL(state => state.plugins);
  const visiblePlugin = useGraphiQL(state => state.visiblePlugin);
  const { setVisiblePlugin } = useGraphiQLActions();
  return (
    <button onClick={() => setVisiblePlugin(plugins[0])}>
      {visiblePlugin?.title}
    </button>
  );
}
```

The doc explorer and history plugins follow the same split, scoped to their own store:

**Before:**

```tsx
import { useExplorerContext } from '@graphiql/plugin-doc-explorer';

const { explorerNavStack, push, pop } = useExplorerContext();
```

**After:**

```tsx
import {
  useDocExplorer,
  useDocExplorerActions,
} from '@graphiql/plugin-doc-explorer';

const explorerNavStack = useDocExplorer(state => state.navStack);
const { push, pop } = useDocExplorerActions();
```

```tsx
import { useHistoryContext } from '@graphiql/plugin-history';

const { items, addToHistory } = useHistoryContext();
```

```tsx
import { useHistory, useHistoryActions } from '@graphiql/plugin-history';

const items = useHistory(state => state.items);
const { addToHistory } = useHistoryActions();
```

See the [`@graphiql/react` README](../../packages/graphiql-react/README.md#available-stores) for the full list of available store selectors and actions.

## New `transport` prop

`@graphiql/toolkit` adds `createTransport`, which takes the same options as `createGraphiQLFetcher` and produces a `Transport`. Unlike `Fetcher`, a `Transport`'s response carries the real HTTP wire data: status code, headers, body, timing, and request/response sizes. `<GraphiQL>` accepts a new `transport` prop alongside the existing `fetcher` prop; the two are mutually exclusive at the type level. The old API still works, unchanged.

### `createGraphiQLFetcher` → `createTransport`

The HTTP options object carries over. Subscriptions are different: `createTransport` does not build a subscription client for you. You construct your own `graphql-ws` (or `graphql-sse`) client and pass it as `subscriptionClient`. There is no `subscriptionUrl`, `wsClient`, `legacyWsClient`, or `wsConnectionParams` option on `createTransport` — those remain `createGraphiQLFetcher`-only.

One of those `createGraphiQLFetcher` options did change: the deprecated `legacyClient` alias has been removed. It was a duplicate name for `legacyWsClient`, so if you passed `legacyClient`, rename it to `legacyWsClient` — same `subscriptions-transport-ws` client, one name instead of two.

**Before:**

```ts
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const fetcher = createGraphiQLFetcher({
  url: 'https://my.endpoint/graphql',
  subscriptionUrl: 'wss://my.endpoint/graphql',
});
```

**After (WebSocket subscriptions):**

```ts
import { createClient } from 'graphql-ws';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  subscriptionClient: createClient({ url: 'wss://my.endpoint/graphql' }),
});
```

**After (SSE subscriptions):**

`graphql-sse`'s `createClient()` is signature-compatible with `graphql-ws`, so the same option drives either protocol:

```ts
import { createClient } from 'graphql-sse';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  subscriptionClient: createClient({
    url: 'https://my.endpoint/graphql/stream',
  }),
});
```

If you only run queries and mutations, leave `subscriptionClient` off. A subscription dispatched without it throws with a pointer back to this page.

### `<GraphiQL fetcher={...}>` → `<GraphiQL transport={...}>`

**Before:**

```tsx
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';

const fetcher = createGraphiQLFetcher({ url: 'https://my.endpoint/graphql' });

function App() {
  return <GraphiQL fetcher={fetcher} />;
}
```

**After:**

```tsx
import { createTransport } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';

const transport = createTransport({ url: 'https://my.endpoint/graphql' });

function App() {
  return <GraphiQL transport={transport} />;
}
```

Passing both props is a type error. Remove `fetcher` when you add `transport`.

### What you get

With a `Transport`, the response pane header shows the real HTTP status code, total round-trip time, and the request and response byte sizes, read directly off the `Response`. Response headers are accessible through the response detail panel.

With a `fetcher`, none of that is observable. The `Fetcher` contract is `(params) => ExecutionResult`, which discards the HTTP envelope before GraphiQL sees it. The response pane shows a small dismissible notice pointing here instead of fabricated values.

### Request methods

`createTransport` supports sending queries over `GET` in addition to the default `POST`, per the [GraphQL-over-HTTP spec](https://graphql.github.io/graphql-over-http/draft/). Pass `method` and `supportedMethods` to control it:

```ts
const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  method: 'GET',
  supportedMethods: ['GET', 'POST'],
});
```

Mutations always send over `POST` regardless of the selected method, since `GET` and the safe/idempotent `QUERY` method aren't allowed to carry side effects. `Transport` exposes the active `url`, `method`, `supportedMethods`, and an optional `setMethod` for switching at runtime — the top bar's method chip in `graphiql` uses this to let you flip between `GET` and `POST` from the UI.

### Custom transports (FAQ)

If you hand-rolled a `Fetcher` rather than using `createGraphiQLFetcher`, migrate by implementing the `Transport` interface directly. A `Transport` is an object with a `send(request)` method. For queries and mutations it returns a `Promise<TransportResponse>`; for subscriptions and incremental delivery it returns an `AsyncIterable<TransportResponse>`, one entry per event or chunk.

**Before (custom fetcher):**

```ts
import type { Fetcher } from '@graphiql/toolkit';

const fetcher: Fetcher = async params => {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
};
```

**After (custom transport):**

```ts
import type { Transport } from '@graphiql/toolkit';

const transport: Transport = {
  async send(request) {
    const startMs = performance.now();
    const requestBody = JSON.stringify({
      query: request.query,
      operationName: request.operationName,
      variables: request.variables,
    });
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...request.headers },
      body: requestBody,
    });
    const body = await response.json();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      ok: !body.errors?.length,
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      timing: { totalMs: performance.now() - startMs },
      size: {
        request: new TextEncoder().encode(requestBody).length,
        response: new TextEncoder().encode(JSON.stringify(body)).length,
      },
    };
  },
};
```

Read `status`, `statusText`, and `headers` off the real `Response`. Don't hard-code them; the response pane reads those fields directly.

### CDN usage

Script-tag consumers get the same API without a bundler: the CDN bundle exposes `GraphiQL.createTransport` and `GraphiQL.createWsClient` (re-exporting `graphql-ws`'s `createClient`) as static properties on the `GraphiQL` component.

```html
<script>
  const transport = GraphiQL.createTransport({
    url: 'https://my.endpoint/graphql',
    subscriptionClient: GraphiQL.createWsClient({
      url: 'wss://my.endpoint/graphql',
    }),
  });

  ReactDOM.createRoot(document.getElementById('graphiql')).render(
    React.createElement(GraphiQL, { transport }),
  );
</script>
```

`GraphiQL.createFetcher` (the old `createGraphiQLFetcher`) is still there too, marked deprecated, for anyone updating a CDN embed incrementally.

### What's deprecated, not removed

| Deprecated                                       | Replacement       |
| ------------------------------------------------ | ----------------- |
| `createGraphiQLFetcher` from `@graphiql/toolkit` | `createTransport` |
| `fetcher` prop on `<GraphiQL>`                   | `transport` prop  |
| `Fetcher` type from `@graphiql/toolkit`          | `Transport`       |

Existing code keeps compiling and running today. Migrate when you want the response pane to show real wire data, or before a future major version drops the deprecated path.

### Active operation follows the cursor

Unrelated to transport, but shipping in the same release: in a document with more than one operation, the active operation now tracks the editor cursor. Moving the cursor into a different named operation updates `operationName`, so the Run button, the operation dropdown, and operation-aware plugins reflect the operation you are editing. Previously `operationName` changed only on run-at-cursor (`Cmd`/`Ctrl`+`Enter`) or by picking from the operation dropdown.

Two things to know if you embed GraphiQL:

- The `onEditOperationName` callback now fires when the cursor crosses into a different named operation, not only on edit or run. If you mirror `operationName` into your URL or app state, expect it to update as the user navigates between operations.
- A tab holding multiple operations shows the active operation name followed by a `+N` count of the others (for example, `GetUser +2`).

To opt out of cursor tracking, pin the operation with the `operationName` prop on `<GraphiQL>`; an explicit `operationName` overrides what the cursor would otherwise select.

## New first-party plugins

Two new plugins ship in v6 and are **installed by default** in the `graphiql` meta-package: a visual query builder and operation collections. If you pass your own `plugins` array to `<GraphiQL>`, it replaces the default set entirely, so you'll want to include the ones you still want alongside your custom plugins.

### `@graphiql/plugin-query-builder`

Closes the long-standing [#734](https://github.com/graphql/graphiql/issues/734): a schema-driven, click-to-build alternative to hand-writing operations. It renders the schema's root types as a collapsible tree; checking a field adds it to the current operation and unchecking removes it, parsed and reprinted through `graphql`'s AST utilities so it round-trips cleanly with whatever's already in the editor. Fields expose argument inputs for scalars, enums, lists, and input objects (including lists of input objects); scalar arguments can be promoted to variables; named fragments can be created from a selection; and union/interface fields get inline-fragment type-condition selectors.

```tsx
import { GraphiQL } from 'graphiql';
import { QUERY_BUILDER_PLUGIN } from '@graphiql/plugin-query-builder';
import '@graphiql/plugin-query-builder/style.css';

<GraphiQL plugins={[QUERY_BUILDER_PLUGIN]} transport={transport} />;
```

### `@graphiql/plugin-collections`

Save named operations into folder collections and reuse them later: a collapsible tree UI with inline rename, drag-and-drop (or keyboard) reordering, JSON import/export that merges by stable id instead of duplicating, and clipboard copy/share for individual operations or whole collections. Saving is wired to `Cmd`/`Ctrl`+`S` and the tab-strip Save button.

```tsx
import { GraphiQL } from 'graphiql';
import { collectionsPlugin } from '@graphiql/plugin-collections';
import '@graphiql/plugin-collections/style.css';

<GraphiQL plugins={[collectionsPlugin()]} transport={transport} />;
```

`collectionsPlugin()` takes options for a custom storage backend and for locking down a governed deployment (`readOnly`, `allowImportExport`, `allowReplace`). See the [package README](../../packages/graphiql-plugin-collections/README.md) for the full option list and the import/merge semantics.

### Opting out

Both plugins are part of the default `plugins` array (`[HISTORY_PLUGIN, QUERY_BUILDER_PLUGIN, collectionsPlugin()]`), alongside history. Pass your own array to drop one or both:

```tsx
import { GraphiQL, HISTORY_PLUGIN } from 'graphiql';

// History only — no query builder, no collections.
<GraphiQL plugins={[HISTORY_PLUGIN]} transport={transport} />;
```

Their stylesheets are bundled into `graphiql`'s own `style.css` regardless of whether they're in your `plugins` list, so opting out removes the panel and rail icon but not the (small) amount of CSS from the bundle.

## `@graphiql/plugin-explorer` removal

`@graphiql/plugin-explorer` — the plugin wrapping OneGraph's `graphiql-explorer` library — is **removed in v6**. It wrapped a library that is no longer actively maintained upstream, and its role is now filled by the first-party `@graphiql/plugin-query-builder` described above, which is default-installed and covers the same "build a query without typing it" use case with fragment, variable, and union/interface support that `graphiql-explorer` never had.

The package is no longer published from the v6 line. If you still depend on it and can't migrate yet, it remains available on the **v5 LTS branch** — the last `5.x` release stays on npm and is maintained there — but new development targets the query builder.

### Migrating

In most integrations this is a drop-in swap:

**Before:**

```tsx
import { GraphiQL } from 'graphiql';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import '@graphiql/plugin-explorer/style.css';

const explorer = explorerPlugin();

<GraphiQL plugins={[explorer]} transport={transport} />;
```

**After:**

```tsx
import { GraphiQL } from 'graphiql';
import { QUERY_BUILDER_PLUGIN } from '@graphiql/plugin-query-builder';
import '@graphiql/plugin-query-builder/style.css';

<GraphiQL plugins={[QUERY_BUILDER_PLUGIN]} transport={transport} />;
```

If you're using `graphiql` (rather than assembling your own plugin list), the query builder plugin is already installed by default, so you can likely just remove `explorerPlugin()` from your `plugins` array and drop the `@graphiql/plugin-explorer` dependency entirely.

Check the [known limitations](../../packages/graphiql-plugin-query-builder/README.md#known-limitations) in the query builder's README before migrating a heavily-scripted or aliased set of operations — a small number of edge cases (repeated aliased fields, explicit `null` arguments) aren't yet covered.

If you can't migrate before upgrading to v6, pin `@graphiql/plugin-explorer` to its last `5.x` release from npm and track the v5 LTS branch, where it stays maintained.

## Theme, density, and font-size settings

v6 adds a settings dialog (the gear icon in the activity rail) with controls for theme, density, and font size, backed by a new `useGraphiQLSettings()` hook in `@graphiql/react`. Settings persist to `localStorage` and apply live via `data-*` attributes, so custom CSS can key off them the same way component internals do.

```ts
import { useGraphiQLSettings } from '@graphiql/react';

const { theme, density, fontSize, setTheme, setDensity, setFontSize } =
  useGraphiQLSettings();
```

| Setting    | Values                                            | Default         |
| ---------- | ------------------------------------------------- | --------------- |
| `theme`    | `'auto'` \| `'light'` \| `'dark'`                 | `'auto'`        |
| `density`  | `'compact'` \| `'comfortable'` \| `'spacious'`    | `'comfortable'` |
| `fontSize` | `'compact'` \| `'default'` \| `'large'` \| `'xl'` | `'default'`     |

`'auto'` theme follows `prefers-color-scheme` and updates live if the OS setting changes while GraphiQL is open.

### CSS attribute selectors

Each setting is reflected as an attribute (`data-theme`, `data-density`, `data-font-size`) on the container, with `tokens.css` defining the values each preset resolves to (see [CSS and retheming](#css-and-retheming) for the color tokens; density and font-size presets fill in things like `--row-padding-y`, `--top-bar-height`, and `--font-size-body`). If you write custom CSS that needs to vary by density or font size, target the same attributes:

```css
[data-density='compact'] .my-custom-toolbar {
  padding-block: 2px;
}
```

### Pinning a value for embedders

If you embed GraphiQL in a product with its own theme system and don't want users toggling GraphiQL's theme independently, pass `forcedTheme` to `<GraphiQL>`:

```tsx
<GraphiQL transport={transport} forcedTheme="dark" />
```

`forcedTheme` accepts `'light'`, `'dark'`, or `'system'`, and hides the theme control in the settings dialog entirely (density and font size remain user-adjustable). There isn't an equivalent forced prop for density or font size today — if you need to pin those too, set the `data-density` / `data-font-size` attribute on your container yourself after mount and it'll take precedence over whatever the settings dialog last wrote, until the user changes it again from the dialog.

## Considering for removal in v7

Nothing below is happening in v6. These are informal signals about where the project is headed, not commitments — flagging them now so a v7 major version isn't the first time you hear about them.

- **React 18 support.** v6 still supports React 18 and 19 as peer dependencies. A future major version may drop React 18 once the React 19 adoption curve looks similar to where 18 was when 17 support was dropped.
- **GraphQL.js 15 support.** Similarly, `graphql` `^15.5.0` remains a supported peer range in v6 alongside `^16` and `^17`. Expect the floor to move up in a future major version.
- **The v5 HSL variable set.** The old `--color-*` variables are **deprecated in v6**. They're still defined — frozen at their v5 values — for backward compatibility, but no v6 component reads them: internal usage was migrated to the OKLCH tokens in `tokens.css` (see [CSS and retheming](#css-and-retheming)). A transparent compatibility shim isn't feasible, because the two systems use different color formats — `h, s%, l%` for `hsl()` versus `L% C H` for `oklch()` — so an old variable can't simply alias a new one. Expect the frozen definitions to be removed in v7. If your integration reads or sets the v5 variable names, migrate to the new tokens now (see [Migrating `--color-*` overrides](#migrating---color--overrides)) and weigh in on [discussion #4219](https://github.com/graphql/graphiql/discussions/4219).

## Other notes

- **Browserslist.** v6 drops the project's custom `.browserslistrc` in favor of the single `defaults` browserslist preset (`> 0.5%, last 2 versions, Firefox ESR, not dead`). That range covers the modern browsers that support the OKLCH color functions the new token system relies on. If your previous bespoke config deliberately targeted very old browsers, they may fall outside the new range — check `defaults` against your support matrix if that matters to you.
- **Monaco editor theme registration.** The built-in Monaco themes (`graphiql-DARK` and `graphiql-LIGHT`) were rewritten to use the v6 accent palette — every GraphQL token type (keywords, type names, field identifiers, variables, annotations, strings, numbers, comments) and the surrounding editor chrome (suggest widget, hover widget, quick input) now pull from the same tokens as the rest of the UI. The `editorTheme` prop on `<GraphiQL>` still takes the same `{ dark, light }` pair of Monaco theme names or definitions it always did, so a custom theme registered through that prop should continue to work unchanged. If you were depending on the specific color values baked into the previous built-in `graphiql-DARK` / `graphiql-LIGHT` themes (for a screenshot test, for example), expect those values to have shifted.
