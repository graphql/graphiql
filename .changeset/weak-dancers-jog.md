---
'graphiql': major
---

Remove `toolbar.additionalContent` and `toolbar.additionalComponent` props in favor of `GraphiQL.Toolbar` render props.

## Migration from `toolbar.additionalContent`

### Before

```jsx
<GraphiQL toolbar={{ additionalContent: <button>My button</button> }} />
```

### After

```jsx
<GraphiQL>
  <GraphiQL.Toolbar>
    {({ merge, prettify, copy }) => (
      <>
        {prettify}
        {merge}
        {copy}
        <button>My button</button>
      </>
    )}
  </GraphiQL.Toolbar>
</GraphiQL>
```

## Migration from `toolbar.additionalComponent`

### Before

```jsx
<GraphiQL
  toolbar={{
    additionalComponent: function MyComponentWithAccessToContext() {
      return <button>My button</button>;
    },
  }}
/>
```

### After

```jsx
<GraphiQL>
  <GraphiQL.Toolbar>
    {({ merge, prettify, copy }) => (
      <>
        {prettify}
        {merge}
        {copy}
        <MyComponentWithAccessToContext />
      </>
    )}
  </GraphiQL.Toolbar>
</GraphiQL>
```

---

Additionally, you can sort default toolbar buttons in different order or remove unneeded buttons for you:

```jsx
<GraphiQL>
  <GraphiQL.Toolbar>
    {({ prettify, copy }) => (
      <>
        {copy /* Copy button will be first instead of default last */}
        {/* Merge button is removed from toolbar */}
        {prettify}
      </>
    )}
  </GraphiQL.Toolbar>
</GraphiQL>
```
