---
'@graphiql/plugin-code-exporter': major
'@graphiql/plugin-explorer': major
'@graphiql/react': minor
'graphiql': major
---

- support react 19, drop support react 16 and react 17
- replace deprecated `ReactDOM.unmountComponentAtNode()` and `ReactDOM.render()` with `root.unmount()` and `createRoot(container).render()`
- update `@radix-ui` and `@headlessui/react` dependencies
