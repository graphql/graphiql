---
'@graphiql/toolkit': minor
---

BREAKING: Don't pass `shouldPersistHeaders` anymore when invoking the fetcher function. This value can be looked up by consuming the `EditorContext`:
```js
import { useEditorContext } from '@graphiql/react';

function MyComponent() {
  const { shouldPersistHeaders } = useEditorContext();
  // Do things...
}
```
