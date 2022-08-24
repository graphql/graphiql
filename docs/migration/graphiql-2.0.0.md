# Upgrading `graphiql` from `1.x` to `2.0.0`

Hello GraphiQL user and thanks for upgrading!

This migration guide walks you through all changes that come with `graphiql@2.0.0`, in particular the breaking ones, and will show you how to upgrade your `1.x` implementation.

> If you encounter any issues while upgrading that are not covered in here, please open an issue or PR on this repo and we will extend this guide.

## Design refresh including dark theme

Arguably the biggest change in `graphiql@2` is the new design of the UI. It has been reworked from scratch to look more modern while keeping its simplistic look and feel. We also finally added a built-in dark theme. Theme selection is based on system defaults and can be changed in the new settings dialog (available by clicking on the gear icon at the bottom of the sidebar on the left of the screen).

Starting with `graphiql@2`, the only officially supported way of customizing the CSS that make up the looks of GraphiQL is by overriding the design tokens defined using CSS variables. In particular, changes to class names are no longer considered breaking changes. If you use class-name based selectors to change styles your overrides might break with minor or patch version bumps.

A list of all CSS variables that can be customized can be found in the [`root.css`](../../packages/graphiql-react/src/style/root.css) file of the `@graphiql/react` package. The variables for colors use a list of values that can be passed into the [`hsl`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl) function in CSS that defines colors by hue, saturation and lightness.

## Changes to `GraphiQL` component props

A couple of props of the `GraphiQL` have undergone breaking changes:

- The props `defaultVariableEditorOpen` and `defaultSecondaryEditorOpen` have been merged into one prop `defaultEditorToolsVisibility`. The default behavior if this prop is not passed is that the editor tools are shown if at least one of the secondary editors has contents. You can pass the following values to the prop:
  - Passing `false` hides the editor tools.
  - Passing `true` shows the editor tools.
  - Passing `"variables"` explicitly shows the variables editor.
  - Passing `"headers"` explicitly shows the headers editor.
- The props `docExplorerOpen`, `onToggleDocs` and `onToggleHistory` have been removed. They are replaced by the more generic props `visiblePlugin` (for controlling which plugin is visible) and `onTogglePluginVisibility` (which is called each time the visibility of any plugin changes).
- The `headerEditorEnabled` prop has been renamed to `isHeadersEditorEnabled`.
- The `ResultsTooltip` prop has been renamed to `responseTooltip`.

### Tabs enabled by default

Tabs were supported opt-in starting with `@graphiql@1.8`. With `graphiql@2` tabs are now always enabled. The `tabs` prop (which previously toggled if tabs were enabled or not) has therefore been replaced with a prop `onTabChange`. If you used the `tabs` prop before to pass this function you can change your implementation like so:

```diff
<GraphiQL
-  tabs={{ onTabChange: (tabState) => {/* do something */} }}
+  onTabChange={(tabState) => {/* do something */}}
/>
```

As long as only one session is open, the tab bar above the editors is hidden. A plus icon next to the logo on the top right allows the user to open more tabs. With at least two tabs opened, the tab bar appears above the editors.

## Removed package exports

All React components apart from the `GraphiQL` component have been moved to the `@graphiql/react` package. That's why we removed most of the exports with `graphiql@2`. Here is a list of all exported components and functions that have been removed and where you can find them now:

- `QueryEditor`, `VariableEditor` and `DocExplorer`: Now exported from `@graphiql/react` under the same names
  - Note that the `schema` prop of the `DocExplorer` no longer exists, the component now uses the schema provided by the `ExplorerContext`.
- `ToolbarMenu`: Now exported from `@graphiql/react` as `ToolbarMenu`
- `ToolbarMenuItem`: Now exported from `@graphiql/react` as `ToolbarMenu.Item`
- `ToolbarSelect`: Now exported from `@graphiql/react` as `ToolbarListbox`
- `ToolbarSelectOption`: Now exported from `@graphiql/react` as `ToolbarListbox.Option`
- `onHasCompletion`: This function is only meant to be used internally, it is no longer being exported
- `fillLeafs`, `getSelectedOperationName` and `mergeAst`: Now exported from `@graphiql/toolkit` under the same names
- types `Fetcher`, `FetcherOpts`, `FetcherParams`, `FetcherResult`, `FetcherReturnType`, `Observable`, `Storage` and `SyncFetcherResult`: Exported from `@graphiql/toolkit` under the same names (previously just re-exported by `graphiql`)

## `GraphiQL` is now a function component

The `GraphiQL` component in `graphiql@1.x` was a class component. That allowed easy access to its props, state and methods by attaching a ref to it like so:

```jsx
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React from 'react';

const fetcher = createGraphiQLFetcher({ url: 'https://my.endpoint' });

class MyComponent extends React.Component {
  _graphiql: GraphiQL;

  componentDidMount() {
    const query = this._graphiql.getQueryEditor().getValue();
  }

  render() {
    return <GraphiQL ref={r => (this._graphiql = r)} fetcher={fetcher} />;
  }
}
```

With `graphiql@2` we refactored the codebase to more "modern" React. This also meant replacing all class components with function components. The code above no longer works in `graphiql@2` as attaching refs to function components is not possible in React.

All logic and state management now lives in multiple React contexts, provided by the `@graphiql/react` package. The `GraphiQL` component is now basically combining two other components, both of which are also exported by the package.

- `GraphiQLProvider` (originally coming from `@graphiql/react`) will render all context providers and takes care of state management
- `GraphiQLInterface` is defined in the `graphiql` package and renders the UI

If you want to read or modify GraphiQL state from your custom implementation you need to render both the above components separately as the hooks for consuming the context values only work in components that are rendered inside the provider component.

With all that, the example above can be refactored a such:

```jsx
import { useEditorContext } from '@graphiql/react';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQLInterface, GraphiQLProvider } from 'graphiql';
import { useEffect } from 'react';

const fetcher = createGraphiQLFetcher({ url: 'https://my.endpoint' });

function MyComponent() {
  return (
    <GraphiQLProvider fetcher={fetcher}>
      <InsideContext />
    </GraphiQLProvider>
  );
}

function InsideContext() {
  // Calling this hook would not work in `MyComponent` (it would return `null`)
  const { queryEditor } = useEditorContext();

  useEffect(() => {
    const query = queryEditor.getValue();
  }, []);

  return <GraphiQLInterface />;
}
```

Here is a list of all public class methods that existed in `graphiql@1` and its replacement in `graphiql@2`. All the contexts mentioned below can be accessed using a hook exported by `@graphiql/react`.

- `getQueryEditor`: Use the `queryEditor` property from the `EditorContext`.
- `getVariableEditor`: Use the `variableEditor` property from the `EditorContext`.
- `getHeaderEditor`: Use the `headerEditor` property from the `EditorContext`.
- `refresh`: Calling this method should no longer be necessary, all editors will refresh automatically after resizing. If you really need to refresh manually you have to call the `refresh` method on all editor instances individually.
- `autoCompleteLeafs`: Use the `useAutoCompleteLeafs` hook provided by `@graphiql/react` that returns this function.

There are a couple more class methods that were intended to be private and were already removed starting in `graphiql@1.9.0`. Since they were not actually marked with `private`, here's an extension to the above list for these methods:

- `handleClickReference`: This was a callback method triggered when clicking on a type or field. It would open the doc explorer for the clicked reference. If you want to manually mimic this behavior you can use the `push` method from the `ExplorerContext` to add an item to the navigation stack of the doc explorer, and you can use the `setVisiblePlugin` method of the `PluginContext` to show the doc explorer plugin (by passing the `DOC_EXPLORER_PLUGIN` object provided by `@graphiql/react`).
- `handleRunQuery`: To execute a query, use the `run` method of the `ExecutionContext`. If you want to explicitly set an operation name, call the `setOperationName` method of the `EditorContext` provider before that (passing in the operation name string as argument).
- `handleEditorRunQuery`: Use the `run` method of the `ExecutionContext`.
- `handleStopQuery`: Use the `stop` method from the `ExecutionContext`.
- `handlePrettifyQuery`: Use the `usePrettifyQuery` hook provided by `@graphiql/react` that returns this function.
- `handleMergeQuery`: Use the `useMergeQuery` hook provided by `@graphiql/react` that returns this function.
- `handleCopyQuery`: Use the `useCopyQuery` hook provided by `@graphiql/react` that returns this function.
- `handleToggleDocs` and `handleToggleHistory`: Use the `setVisiblePlugin` method of the `PluginContext`.

Some class methods were callbacks to modify state which are not intended to be called manually. All these methods don't have a successor: `handleEditQuery`, `handleEditVariables`, `handleEditHeaders`, `handleEditOperationName`, `handleSelectHistoryQuery`, `handleResetResize` and `handleHintInformationRender`

### Static properties have been removed

In `graphiql@1.x` the `GraphiQL` component included a bunch of static properties that exposed utility functions and other components. Most of these have been removed in `graphiql@2` since the components and functions have been moved to the `@graphiql/react` and `@graphiql/toolkit` packages.

The properties that remain on the `GraphiQL` function component are `GraphiQL.Logo`, `GraphiQL.Toolbar` and `GraphiQL.Footer`. All three are React components that can be passed as children to the `GraphiQL` components and override certain parts of the UI:

- `GraphiQL.Logo`: Overrides the "logo" at the top right of the screen. By default it contains the text "Graph*i*QL".
- `GraphiQL.Toolbar`: Overrides the toolbar next to the query editor. By default if contains buttons for prettifying the current editor contents, merging fragment definitions into the operation definition and copying the contents of the query editor to the clipboard. Note that the default buttons will not be shown when passing this component as child to `GraphiQL`, instead it will show the children you pass to `GraphiQL.Toolbar`. The execute button will always be shown. If you want to keep the default buttons and add additional buttons you can use the `toolbar` prop.
- `GraphiQL.Footer`: Adds a section below the response editor. By default this won't show up in the UI.

Here is a list of all the static properties that have been removed and their replacements:

- `GraphiQL.formatResult` and `GraphiQL.formatError`: Replaced by equally named functions from `@graphiql/toolkit`
- `GraphiQL.QueryEditor`, `GraphiQL.VariableEditor` and `GraphiQL.HeaderEditor`: Replaced by equally named components from `@graphiql/react`
- `GraphiQL.ResultViewer`: Replaced by the `ResponseEditor` component from `@graphiql/react`
- `GraphiQL.Button`: Replaced by the `ToolbarButton` component from `@graphiql/react`
- `GraphiQL.ToolbarButton`: This exposed the same component as `GraphiQL.Button`.
- `GraphiQL.Menu`: Replaced by the `ToolbarMenu` component from `@graphiql/react`
- `GraphiQL.MenuItem`: Replaced by the `ToolbarMenu.Item` component from `@graphiql/react`
- `GraphiQL.Group`: Grouping multiple buttons side-by-side is not provided out-of-the box anymore in the new GraphiQL UI. If you want to implement a similar feature in the new vertical toolbar you can do so by adding your own styles for your custom toolbar elements. Example:

  ```jsx
  import { createGraphiQLFetcher } from '@graphiql/toolkit';
  import { GraphiQL } from 'graphiql';

  const fetcher = createGraphiQLFetcher({ url: 'https://my.endpoint' });

  function MyComponent() {
    return (
      <GraphiQL fetcher={fetcher}>
        <GraphiQL.Toolbar>
          {/* Add custom styles for your buttons using the given class */}
          <div className="button-group">
            <button>1</button>
            <button>2</button>
            <button>3</button>
          </div>
        </GraphiQL.Toolbar>
      </GraphiQL>
    );
  }
  ```

### `window.g` has been removed

In `graphiql@1.x` the `GraphiQL` class component stored a reference to itself on a global property named `g`. This property has been removed as refs don't exist for function components. (Also, the property was only intended for internal use like testing in the first place.)

## Support for old `graphql` versions removed

The minimum supported version of `graphql` is now `15.8.0`, older versions might not work anymore in combination with `graphiql@2`.
