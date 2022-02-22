---
'graphiql': minor
---

New callback property `onSchemaChange` for `GraphiQL`.

The callback is invoked with the successfully fetched schema from the remote.

**Usage example:**

```tsx
<GraphiQL onSchemaChange={schema => console.log(schema)} />
```
