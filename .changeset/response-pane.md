---
'@graphiql/react': minor
'graphiql': minor
---

Add a response pane header with real status, elapsed time, and response size from the active transport, a copy button, and a JSON / Tree / Table view toggle (the selection is persisted and restored on reload). While a query is running, a centered loading spinner overlays the pane instead of replacing it, so the view picker and results underneath don't jump. All three views share a consistent 16px inset.

- **Tree** renders the response JSON as a collapsible tree with type-colored values; top-level nodes expand by default and deeper levels start collapsed.
- **Table** renders each list field as its own table captioned with its path (e.g. `test.person.friends`); sibling and aliased lists each get a table, nested objects and arrays show as shorthand summaries, non-list responses show an empty state, and rows get a bottom divider.
