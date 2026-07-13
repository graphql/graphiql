[Changelog](https://github.com/graphql/graphiql/blob/main/packages/graphiql-react/CHANGELOG.md)
|
[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphiql_react.html)
| [NPM](https://www.npmjs.com/package/@graphiql/react)

# `@graphiql/react`

A React SDK for building integrated GraphQL developer experiences for the web.

## Purpose

This package contains a set of building blocks that allow its users to build
GraphQL IDEs with ease. It's the set of components that make up Graph*i*QL, the
first and official GraphQL IDE, owned and maintained by the GraphQL Foundation.

There are two kinds of building blocks that this package provides: Stateful
context providers for state management and simple UI components.

## Getting started

All the state for your GraphQL IDE lives in multiple contexts. The easiest way
to get started is by using the `GraphiQLProvider` component that renders all the
individual providers.

There is one required prop called `transport`. This is a function that performs
GraphQL requests against a given endpoint. You can easily create a transport using
the method `createTransport` from the `@graphiql/toolkit` package.

```jsx
import { GraphiQLProvider } from '@graphiql/react';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({
  url: 'https://my.graphql.api/graphql',
});

function MyGraphQLIDE() {
  return (
    <GraphiQLProvider transport={transport}>
      <div className="graphiql-container">Hello GraphQL</div>
    </GraphiQLProvider>
  );
}
```

Inside the provider you can now use any UI component provided by
`@graphiql/react`. For example, you can render an operation editor like this:

```jsx
import { QueryEditor } from '@graphiql/react';

function MyGraphQLIDE() {
  return (
    <GraphiQLProvider transport={transport}>
      <div className="graphiql-container">
        <QueryEditor />
      </div>
    </GraphiQLProvider>
  );
}
```

The package also ships the necessary CSS that all its UI components need. You
can import them from `@graphiql/react/style.css`.

> **Note**: In order for these styles to apply, the UI components need to be
> rendered inside an element that has a class name `graphiql-container`.

By default, the UI components will try to use the
[Inter](https://rsms.me/inter/) font for regular text and the
[JetBrains Mono](https://www.jetbrains.com/lp/mono/) font for mono-space text.
If you want to use the default fonts you can load them using these files:

- `@graphiql/react/font/inter.css`
- `@graphiql/react/font/jetbrains-mono.css`

You can, of course, use any other method to load these fonts (for example,
loading them from Google Fonts). The bundled files are self-hosted subsets
(Latin + Latin Extended, regular and italic) built from the
[`@fontsource-variable/inter`](https://fontsource.org/fonts/inter) and
[`@fontsource-variable/jetbrains-mono`](https://fontsource.org/fonts/jetbrains-mono)
packages; see `Inter-LICENSE.txt` and `JetBrainsMono-LICENSE.txt` alongside
them for licensing (both OFL-1.1).

If you'd rather use the previous v5 fonts, [Roboto](https://fonts.google.com/specimen/Roboto)
and [Fira Code](https://fonts.google.com/specimen/Fira+Code), self-hosted
copies are still bundled and can be loaded instead:

- `@graphiql/react/font/roboto.css`
- `@graphiql/react/font/fira-code.css`

Further details on how to use `@graphiql/react` can be found in the reference
implementation of a GraphQL IDE - Graph*i*QL - in the
[`graphiql` package](https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/components/GraphiQL.tsx).

## Available Stores

GraphiQL uses a set of state management stores, each responsible for a specific part of the IDE's
behavior. These stores contain all logic related to state management and can be accessed via custom
React hooks.

### Core Hooks

- **`useMonaco`**: Access `monaco-editor` exports and the `monaco-graphql` instance. Designed for safe use in SSR environments.
- **`useGraphiQL`**: Access the current state.
- **`useGraphiQLActions`**: Trigger actions that mutate the state. This hook **never** rerenders.

The `useGraphiQLActions` hook **exposes all actions** across store slices.
The `useGraphiQL` hook **provides access to the following store slices**:

| Store Slice                              | Responsibilities                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`storage`](./src/stores/storage.ts)     | Provides a storage API that can be used to persist state in the browser (by default using `localStorage`) |
| [`editor`](./src/stores/editor.ts)       | Manages **query**, **variables**, **headers**, and **response** editors and tabs                          |
| [`execution`](./src/stores/execution.ts) | Handles the execution of GraphQL requests                                                                 |
| [`plugin`](./src/stores/plugin.ts)       | Manages plugins and the currently active plugin                                                           |
| [`schema`](./src/stores/schema.ts)       | Fetches, validates, and stores the GraphQL schema                                                         |
| [`theme`](./src/stores/theme.ts)         | Manages the current theme and provides a method to update it                                              |

### Usage Example

```js
import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';

// Get an action to fetch the schema and an action to change theme
const { introspect, setTheme } = useGraphiQLActions();

// Use a selector to access specific parts of the state like current schema and theme
const { schema, theme } = useGraphiQL(state => ({
  schema: state.schema,
  theme: state.theme,
}));
```

All store properties are documented using TSDoc comments. If you're using an
IDE like VSCode for development, these descriptions will show up in auto-complete
tooltips. All these descriptions can also be found in the
[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphiql_react.html).

## Theming

All the components from `@graphiql/react` have been designed with customization
in mind. We achieve this using CSS variables.

As of v6 the customization surface is the OKLCH design-token set in the
[`tokens.css` file](https://github.com/graphql/graphiql/blob/main/packages/graphiql-react/src/style/tokens.css).

### Colors

GraphiQL's UI colors come from the v6 OKLCH design tokens documented below. The
v5 `--color-*` HSL variables are **deprecated** and kept only for backward
compatibility — see [Deprecated: v5 HSL variables](#deprecated-v5-hsl-variables).

#### OKLCH tokens (v6)

Colors are defined as
[OKLCH](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
component triplets — `L% C H` (lightness, chroma, hue) — stored without the
`oklch()` wrapper so callers can add alpha at the use site:

```css
background: oklch(var(--bg-canvas));
color: oklch(var(--fg-default) / 0.6);
```

The tokens are scoped to `[data-theme='dark']` and `[data-theme='light']`
rather than a media query, so a given variable resolves correctly regardless of
which theme is active. The full set, defined in `tokens.css`, with when to reach
for each:

**Backgrounds** — surfaces, ordered by how they stack:

- `--bg-canvas` — the primary content surface: editors, side panels, the active tab. The base layer everything else sits on.
- `--bg-elevated` — bars and floating chrome above the canvas: the tab strip, panel and response headers, tooltips, dropdown menus, popovers.
- `--bg-subtle` — recessed fills _inside_ a surface: text inputs, secondary-button faces, segmented-control tracks, inline code.
- `--bg-overlay` — transient interaction layers painted on top of a surface: hover, selected, and pressed states.

**Borders** — increasing prominence:

- `--border-default` — the standard divider and component outline; your default choice.
- `--border-muted` — a fainter separator for low-emphasis internal divisions (menu-item rules, quiet section breaks).
- `--border-strong` — the most visible edge, for inputs and dividers that must read clearly against busy content.

**Foreground** — text and icon emphasis, brightest to faintest:

- `--fg-strong` — high-emphasis text: headings, active or selected labels.
- `--fg-default` — body text; the default content color.
- `--fg-muted` — secondary text and resting icons: labels, captions, metadata.
- `--fg-subtle` — tertiary text and quieter icons, one step below muted.
- `--fg-disabled` — text and icons of disabled controls.
- `--fg-dim` — the faintest marks: decorative or comment-level.

**Accents** — the raw hue palette for syntax and status. You rarely set these directly; components and the `--type-*` tokens assign the roles (links and focus rings → `--accent-blue`, errors → `--accent-red`, success → `--accent-green`, deprecation → `--accent-orange`, and so on). The full set: `--accent-blue`, `--accent-green`, `--accent-green-light`, `--accent-yellow`, `--accent-orange`, `--accent-red`, `--accent-purple`, `--accent-pink`.

**Type-name categories** — `--type-composite`, `--type-scalar`, `--type-enum`, `--type-input`. Color GraphQL type names by kind; see the note below.

**Run button** — `--btn-primary` and `--btn-primary-border`: fill and border for the primary action (Run). A fixed mid-tone green tuned to keep light text legible in both themes — reserve it for the main call-to-action rather than general buttons.

**Radii** — `--radius-sm` (4px; small controls: buttons, inputs, chips), `--radius-md` (6px; menus and cards), `--radius-lg` (8px; dialogs and large panels).

**Shadow** — `--shadow-popover`: the elevation shadow for floating surfaces (menus, tooltips, dialogs).

**Type-name categories.** In the schema-aware plugins (doc explorer, query
builder), type names are colored by GraphQL kind rather than a single color:
object/interface/union share `--type-composite`, scalars use `--type-scalar`,
enums use `--type-enum`, and input objects use `--type-input`. By default each
aliases an `--accent-*` token, so you can retint either the accent or the
`--type-*` token directly. (In the light theme `--type-input` isn't an alias —
`--accent-yellow` is only AA-contrast-safe as a background fill, not as text, so
it gets its own darker gold.)

If you're building a plugin that renders type names and want it to match,
`@graphiql/react` exports a `typeCategory(type)` helper that maps any
`GraphQLType` to `'scalar' | 'enum' | 'input' | 'composite'` (unwrapping list
and non-null wrappers first). Apply the corresponding `--type-*` token to your
markup; the internal attribute and class names GraphiQL uses for this are not
part of the public API.

#### Deprecated: v5 HSL variables

> **Deprecated (v6):** The v5 `--color-*` HSL variables (`--color-primary`,
> `--color-neutral`, `--color-base`, and so on) described below are **deprecated
> as of v6** and are no longer read by any component. They remain defined —
> frozen at their v5 values — for backward compatibility, but overriding them no
> longer re-themes GraphiQL. Retheme with the OKLCH tokens above instead; the
> [v6 migration guide](https://github.com/graphql/graphiql/blob/main/docs/migration/graphiql-6.0.0.md#migrating---color--overrides)
> maps each v5 variable to its v6 replacement.

The deprecated v5 colors are defined using the
[HSL format](https://en.wikipedia.org/wiki/HSL_and_HSV): all CSS variables for
colors are defined as a list of the three values that make up HSL (hue,
saturation and lightness).

This approach allowed `@graphiql/react` to use transparent colors by passing the
value of the CSS variable in the `hsla` function. The v6 OKLCH tokens keep the
same idea — the triplet is composed with `oklch(var(--x) / <alpha>)` — so
transparency still works at the call site.

## Development

If you want to develop with `@graphiql/react` locally - in particular when
working on the `graphiql` package - all you need to do is run `yarn dev` in the
package folder in a separate terminal. This will build the package using Vite.
When using it in combination with `yarn dev:graphiql` (running in the repo
root) this will give you auto-reloading when working on `graphiql` and
`@graphiql/react` simultaneously.
