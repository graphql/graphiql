---
'@graphiql/react': minor
'graphiql': major
---

Replace the left-side plugin sidebar with `ActivityRail`. Plugins render as a flat list in registration order with a 2px blue left border on the active plugin. Settings gear at the bottom opens the settings dialog.

The previous `graphiql-sidebar` DOM structure and CSS class names are removed. Custom CSS overrides targeting `.graphiql-sidebar` or its children will need updating. Only CSS variable names are part of the public API.
