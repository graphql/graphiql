# Upgrading `graphiql` to `6.0.0`

GraphiQL 6 ships with a complete visual overhaul, new first-party features and APIs, and removals of deprecated APIs. This guide explains what changed and how to update your integration. If you run into an issue that this guide doesn't cover, [open an issue](https://github.com/graphql/graphiql/issues/new).

## Contents

1. [Overview](#overview)
2. [CSS and retheming](#css-and-retheming)
3. [New first-party plugins](#new-first-party-plugins)
4. [New `transport` API](#new-transport-api)
5. [Theme, density, and font-size settings](#theme-density-and-font-size-settings)
6. [Monaco Editor 0.56 and 0.57 worker setup](#monaco-editor-056-and-057-worker-setup)
7. [GraphQL.js minimum version](#graphqljs-minimum-version)
8. [`@graphiql/plugin-explorer` removal](#graphiqlplugin-explorer-removal)
9. [Removed hooks](#removed-hooks)
10. [Removed `GraphiQL.Toolbar` and `GraphiQL.Logo`](#removed-graphiqltoolbar-and-graphiqllogo)
11. [Deprecated APIs](#deprecated-apis)
12. [Active operation follows the cursor](#active-operation-follows-the-cursor)
13. [Other notes](#other-notes)

## Overview

GraphiQL 6 introduces an OKLCH-based design-token system and redesigns the app shell and component library. If your integration or plugin uses the v5 `--color-*` variables, follow [CSS and retheming](#css-and-retheming) to migrate your styles. Integrations and plugins that don't customize GraphiQL's CSS don't need styling changes.

Two new first-party plugins are installed by default: a visual query builder and operation collections. The query builder replaces `@graphiql/plugin-explorer`, which is removed in v6.

The new `Transport` API exposes HTTP status, headers, timing, and request and response sizes to GraphiQL. The existing `Fetcher` API still works, but it is deprecated in favor of `Transport`.

Other breaking changes include:

- The hooks deprecated in v5, including `useEditorContext` and `usePluginContext`, are removed. Use the new store selectors and actions instead.
- The `GraphiQL.Toolbar` and `GraphiQL.Logo` children are removed. Use plugin `sessionActions` and the top bar's `brand` prop instead.
- Applications that configure Monaco workers directly must update to Monaco's exported worker entry points.
- The `graphql` peer dependency now requires `^16.11.0 || ^17.0.0`.

## CSS and retheming

If you don't override GraphiQL's CSS, no action is required. The new styles apply automatically.

If you retheme GraphiQL with CSS custom properties, v6 adds a second token system and deprecates the old one. It does not replace the old variables with new values under the same names.

The v5 variables (`--color-primary`, `--color-neutral`, `--color-base`, and others) remain defined under `.graphiql-container` at their v5 values. They contain `h, s%, l%` triplets for use with `hsl(var(--x))`. Your custom CSS can keep reading these variables, but no v6 component uses them. All restyled surfaces use the new OKLCH tokens in `tokens.css`.

Practically, that means:

- **Overriding a `--color-*` variable no longer re-themes GraphiQL's built-in UI.** The variables still resolve, so custom CSS of your own that reads them won't break, but because no component reads them, setting `--color-primary` or `--color-neutral` has no effect on the redesigned surfaces. To retheme v6, set the OKLCH tokens instead.
- **There is no automatic conversion** between the two systems and no compatibility shim. The formats differ: v5 represents a color as `h, s%, l%` for `hsl()`, while v6 uses `L% C H` for `oklch()`. An old variable therefore can't simply alias a new one. See [Migrating `--color-*` overrides](#migrating---color--overrides) below.

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

The nine v5 `--color-*` names don't have a published 1:1 mapping to the new palette. Some v5 roles split into several v6 tokens. For example, one `--color-base` background becomes `--bg-canvas`, `--bg-elevated`, `--bg-subtle`, and `--bg-overlay`. v6 also introduces categories that v5 didn't have, including a three-step border scale and separate `--fg-disabled` and `--fg-dim` values. If you have a bespoke theme, map your brand colors to the new tokens instead of treating the migration as a mechanical find-and-replace.

Both token sets are documented in the [`@graphiql/react` README](../../packages/graphiql-react/README.md#theming); [`tokens.css`](../../packages/graphiql-react/src/style/tokens.css) remains the canonical source for exact values.

### Migrating `--color-*` overrides

A single v5 variable often maps to several v6 tokens, depending on the surface. Use this table as a starting point for mapping GraphiQL's old internal variables to the new tokens:

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

In schema-aware plugins such as the doc explorer and query builder, type-name references are colored by their GraphQL kind. This makes field lists easier to scan because leaf types stand out from the objects you can open.

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

The Monaco query editor is not schema-aware, so it can't tell a scalar from an object by name alone. Type names in the query text therefore keep a single color. This categorization applies only to the schema-driven plugin interfaces.

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

v5 toggled `body.graphiql-light` / `body.graphiql-dark` classes and used a `prefers-color-scheme` media query. v6 applies the new token cascade through `data-theme="light"` / `data-theme="dark"` instead. The old `body.graphiql-*` classes remain available for backwards compatibility, so CSS that uses them still works. If your JavaScript reads the theme from `document.body.classList`, consider using `useGraphiQLSettings()` (see [Theme, density, and font-size settings](#theme-density-and-font-size-settings)) or reading the `data-theme` attribute directly.

## New first-party plugins

Two new plugins ship in v6 and are **installed by default** in the `graphiql` meta-package: a visual query builder and operation collections. If you pass your own `plugins` array to `<GraphiQL>`, it replaces the default set entirely, so you'll want to include the ones you still want alongside your custom plugins.

### `@graphiql/plugin-query-builder`

The query builder is a schema-driven alternative to writing operations by hand. Select fields from a collapsible tree to add them to the current operation, or clear them to remove them. You can also provide field arguments, promote scalar arguments to variables, create named fragments, and select type conditions for unions and interfaces. This resolves the long-standing [#734](https://github.com/graphql/graphiql/issues/734).

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
import { COLLECTIONS_PLUGIN } from '@graphiql/plugin-collections';
import '@graphiql/plugin-collections/style.css';

<GraphiQL plugins={[COLLECTIONS_PLUGIN]} transport={transport} />;
```

Use `collectionsPlugin(options)` instead when you need a custom storage backend or want to restrict write, import, export, or replace operations. See the [package README](../../packages/graphiql-plugin-collections/README.md) for the full option list and the import and merge behavior.

### Opting out

Both plugins are part of the default `plugins` array (`[HISTORY_PLUGIN, QUERY_BUILDER_PLUGIN, COLLECTIONS_PLUGIN]`), alongside history. Pass your own array to drop one or both:

```tsx
import { GraphiQL, HISTORY_PLUGIN } from 'graphiql';

// History only: no query builder or collections.
<GraphiQL plugins={[HISTORY_PLUGIN]} transport={transport} />;
```

## New `transport` API

`@graphiql/toolkit` introduces `createTransport`, which creates a `Transport` that exposes the HTTP status, headers, response body, timing, and request and response byte sizes. The `<GraphiQL>` component accepts it through the new `transport` prop. The existing `fetcher` prop remains functional, but it is deprecated in favor of `transport`.

### `createGraphiQLFetcher` → `createTransport`

To migrate from `createGraphiQLFetcher` to `createTransport`:

1. Replace the `createGraphiQLFetcher` import and call with `createTransport`.
2. Keep the shared HTTP options, such as `url`, `headers`, and `fetch`.
3. For subscriptions, create a `graphql-ws` or `graphql-sse` client and pass it as `subscriptionClient`. The `subscriptionUrl`, `wsClient`, `legacyWsClient`, and `wsConnectionParams` options are not available on `createTransport`.

If you continue using `createGraphiQLFetcher` for now, replace the removed `legacyClient` option with `legacyWsClient`.

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

### `Transport` benefits

With a `Transport`, the response pane header shows the HTTP status code, total round-trip time, and request and response byte sizes. The response detail panel also shows the response headers.

The `Fetcher` contract returns only the parsed GraphQL result, so GraphiQL can't show this HTTP metadata when you use `fetcher`.

### Request methods

`createTransport` supports three HTTP methods:

- `POST` is the default. It sends queries and mutations in a JSON request body.
- `GET` sends queries in the URL without a request body.
- [`QUERY`](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/) sends queries in a JSON request body but is defined as safe and idempotent.

Use `method` to set the initial method and `supportedMethods` to list the methods users can select:

```ts
const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  method: 'QUERY',
  supportedMethods: ['GET', 'POST', 'QUERY'],
});
```

Mutations always use `POST` because `GET` and `QUERY` are safe methods and can't carry side effects. If `POST` isn't included in `supportedMethods`, attempting a mutation throws an error. When you configure more than one method, the top bar's method control cycles through the entries in `supportedMethods`.

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

### CDN usage

Use the [CDN example](../../examples/graphiql-cdn) as a starting point. To add subscriptions, map `graphql-ws` in its import map and pass a subscription client to the transport:

```html
<script type="module">
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import { createTransport } from '@graphiql/toolkit';
  import { createClient } from 'graphql-ws';
  import { GraphiQL } from 'graphiql';
  import 'graphiql/setup-workers/esm.sh';

  const transport = createTransport({
    url: 'https://my.endpoint/graphql',
    subscriptionClient: createClient({
      url: 'wss://my.endpoint/graphql',
    }),
  });

  createRoot(document.getElementById('graphiql')).render(
    React.createElement(GraphiQL, { transport }),
  );
</script>
```

## Theme, density, and font-size settings

v6 adds a settings dialog (the gear icon in the activity rail) with controls for theme, density, and font size. The new `useGraphiQLSettings()` hook in `@graphiql/react` exposes the active values and setters. GraphiQL saves these settings to `localStorage` and reflects them as `data-*` attributes on its container. Custom integrations can use those attributes to adjust their own spacing, typography, or colors when a user changes a setting.

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

## Monaco Editor 0.56 and 0.57 worker setup

GraphiQL 6 supports Monaco Editor 0.56 and 0.57, and installs 0.57 by default. This also moves `monaco-graphql` to its next major version because Monaco changed its worker API and replaced the legacy `monaco-editor/esm/vs/*` deep imports with exported entry points.

If you use one of GraphiQL's worker setup helpers, keep the same import. The helpers now load the Monaco 0.57 worker entry points for you:

```ts
import 'graphiql/setup-workers/vite';
// or: graphiql/setup-workers/webpack
// or: graphiql/setup-workers/esm.sh
```

If your application installs or configures Monaco directly, make these changes:

1. Upgrade `monaco-editor` to `0.57.x`, or remain on `0.56.x` if needed. `monaco-graphql@2` accepts `>=0.56.0 <0.58.0`.
2. Replace `monaco-editor/esm/vs/*` imports with Monaco's exported entry points. For example, import the editor worker from `monaco-editor/editor/editor.worker` and the JSON worker from `monaco-editor/languages/features/json/json.worker`.
3. Configure `globalThis.MonacoEnvironment.getWorker` to return the GraphQL worker for the `graphql` label. Returning a URL from `getWorkerUrl` is not sufficient for the new worker contract.

```ts
globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    return label === 'graphql' ? new GraphQLWorker() : new EditorWorker();
  },
};
```

Custom GraphQL workers must call Monaco's `initialize` function as soon as the worker module loads. Don't wrap it in an additional `onmessage` handler. To pass functions or other values that structured cloning can't transfer to the worker, subclass `GraphQLWorker` and override its `initialize` method. See the [`monaco-graphql` custom worker example](../../packages/monaco-graphql/README.md#custom-webworker-for-passing-non-static-config-to-worker) for the complete worker and bundler configuration.

## GraphQL.js minimum version

GraphiQL 6 requires `graphql` `^16.11.0 || ^17.0.0`. Upgrade `graphql` before upgrading GraphiQL.

If you must remain on GraphQL.js 15 or 16.0–16.10, stay on `graphiql` 5.x and the matching previous majors of the other packages.

## `@graphiql/plugin-explorer` removal

`@graphiql/plugin-explorer`, which wraps OneGraph's `graphiql-explorer` library, is **removed in v6**. The upstream library is no longer actively maintained. The default-installed `@graphiql/plugin-query-builder` replaces it and supports fragments, variables, unions, and interfaces.

The package is no longer published from the v6 line. If you can't migrate yet, use its last `5.x` release from npm and remain on the **v5 LTS branch**. New development targets the query builder.

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

If you can't migrate before upgrading to v6, pin `@graphiql/plugin-explorer` to its last `5.x` release from npm and track the v5 LTS branch, where it stays maintained.

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

The old hooks bundled state and the actions that modify it into one object. The replacements separate reads from writes: use `useGraphiQL(selector)` for state and `useGraphiQLActions()` for actions. A component that only calls an action can then skip re-rendering when unrelated state changes.

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

const explorerNavStack = useDocExplorer();
const { push, pop } = useDocExplorerActions();
```

```tsx
import { useHistoryContext } from '@graphiql/plugin-history';

const { items, addToHistory } = useHistoryContext();
```

```tsx
import { useHistory, useHistoryActions } from '@graphiql/plugin-history';

const items = useHistory();
const { addToHistory } = useHistoryActions();
```

See the [`@graphiql/react` README](../../packages/graphiql-react/README.md#available-stores) for the full list of available store selectors and actions.

## Removed `GraphiQL.Toolbar` and `GraphiQL.Logo`

`<GraphiQL.Toolbar>` and `<GraphiQL.Logo>` are removed. Use a plugin's `sessionActions` for custom editor actions and the `brand` prop for branding. `<GraphiQL.Footer>` still works as before.

### `GraphiQL.Toolbar` → plugin `sessionActions`

Custom editor actions now live in the tab strip, next to prettify/merge/copy/save, through a plugin's `sessionActions`: an always-mounted component every registered plugin can provide, regardless of whether that plugin's pane is visible.

**Before:**

```tsx
import { GraphiQL } from 'graphiql';
import { ToolbarButton } from '@graphiql/react';

function App() {
  return (
    <GraphiQL fetcher={fetcher}>
      <GraphiQL.Toolbar>
        {({ prettify, merge, copy }) => (
          <>
            {prettify}
            {merge}
            {copy}
            <ToolbarButton label="My custom action" onClick={onClick} />
          </>
        )}
      </GraphiQL.Toolbar>
    </GraphiQL>
  );
}
```

**After:**

```tsx
import { GraphiQL } from 'graphiql';
import { HISTORY_PLUGIN } from '@graphiql/plugin-history';
import { QUERY_BUILDER_PLUGIN } from '@graphiql/plugin-query-builder';
import { COLLECTIONS_PLUGIN } from '@graphiql/plugin-collections';
import { ToolbarButton, type GraphiQLPlugin } from '@graphiql/react';

const myActionsPlugin: GraphiQLPlugin = {
  title: 'My Plugin',
  icon: MyIcon,
  content: MyPluginPanel,
  sessionActions: () => (
    <ToolbarButton label="My custom action" onClick={onClick} />
  ),
};

function App() {
  return (
    <GraphiQL
      fetcher={fetcher}
      plugins={[
        HISTORY_PLUGIN,
        QUERY_BUILDER_PLUGIN,
        COLLECTIONS_PLUGIN,
        myActionsPlugin,
      ]}
    />
  );
}
```

Prettify, merge, and copy are built into the tab strip, so you don't need to wire them up again. Passing the `plugins` prop replaces the default-installed plugin set. Include the plugins you still want (`HISTORY_PLUGIN`, `QUERY_BUILDER_PLUGIN`, `COLLECTIONS_PLUGIN`) alongside your own.

### `GraphiQL.Logo` → the top bar's `brand` prop

Pass the `brand` prop to `<GraphiQL>` to customize its branding. If you compose your own layout with `GraphiQLInterface`, pass the prop directly to `<TopBar>`. It accepts any `ReactNode` and replaces the default hexagon icon and "GraphiQL" wordmark. Omit the prop to keep the default branding.

**Before:**

```tsx
<GraphiQL fetcher={fetcher}>
  <GraphiQL.Logo>My Company</GraphiQL.Logo>
</GraphiQL>
```

**After:**

```tsx
<GraphiQL fetcher={fetcher} brand="My Company" />
```

`brand` can contain any element, including a logo image and label.

## Deprecated APIs

The following APIs still work in v6, but they are deprecated:

| Deprecated                                       | Replacement       |
| ------------------------------------------------ | ----------------- |
| `createGraphiQLFetcher` from `@graphiql/toolkit` | `createTransport` |
| `fetcher` prop on `<GraphiQL>`                   | `transport` prop  |
| `Fetcher` type from `@graphiql/toolkit`          | `Transport`       |

The v5 `--color-*` variables are also deprecated. They remain defined at their v5 values for custom CSS, but GraphiQL's components no longer read them. Migrate to the OKLCH tokens described in [CSS and retheming](#css-and-retheming).

## Active operation follows the cursor

In a document with more than one operation, the active operation now tracks the editor cursor. Moving the cursor into a different named operation updates `operationName`, so the Run button, the operation dropdown, and operation-aware plugins reflect the operation you are editing. Previously `operationName` changed only on run-at-cursor (`Cmd`/`Ctrl`+`Enter`) or by picking from the operation dropdown.

Two things to know if you embed GraphiQL:

- The `onEditOperationName` callback now fires when the cursor crosses into a different named operation, not only on edit or run. If you mirror `operationName` into your URL or app state, expect it to update as the user navigates between operations.
- A tab holding multiple operations shows the active operation name followed by a `+N` count of the others (for example, `GetUser +2`).

## Other notes

- **Browserslist.** v6 replaces the project's custom `.browserslistrc` contents with the single `defaults` browserslist preset (`> 0.5%, last 2 versions, Firefox ESR, not dead`). That range covers the modern browsers that support the OKLCH color functions the new token system relies on. If your previous bespoke config deliberately targeted very old browsers, check `defaults` against your support matrix.
- **Monaco editor theme registration.** The built-in Monaco themes (`graphiql-DARK` and `graphiql-LIGHT`) use the v6 accent palette. GraphQL tokens and the surrounding editor interface now use the same palette as the rest of GraphiQL. The `editorTheme` prop on `<GraphiQL>` still accepts the same `{ dark, light }` pair of Monaco theme names or definitions, so a custom theme registered through that prop continues to work. If a screenshot test depends on the previous built-in theme values, update its expected colors.
- **`cn` removed from `@graphiql/react`.** The `cn` helper was just a re-export of `clsx`. It's gone now, so import `clsx` directly from the `clsx` package instead.
