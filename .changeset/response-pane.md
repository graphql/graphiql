---
'@graphiql/react': minor
---

Add a response pane header with real status, elapsed time, and response size from the active transport, a copy button, and a JSON / Tree / Table view toggle (the selection is persisted and restored on reload).

- **Tree** renders the response JSON as a collapsible tree with type-colored values; top-level nodes expand by default and deeper levels start collapsed.
- **Table** renders each list field as its own table captioned with its path (e.g. `test.person.friends`); sibling and aliased lists each get a table, nested objects and arrays show as shorthand summaries, and non-list responses show an empty state.
