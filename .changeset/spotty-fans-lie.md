---
'graphiql': major
---

BREAKING: Tabs are now always enabled. The `tabs` prop has therefore been replaced with a prop `onTabChange`. If you used the `tabs` prop before to pass this function you can change your implementation like so:
```diff
<GraphiQL
-  tabs={{ onTabChange: (tabState) => {/* do something */} }}
+  onTabChange={(tabState) => {/* do something */}}
/>
```
