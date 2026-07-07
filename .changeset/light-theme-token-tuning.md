---
'@graphiql/react': patch
'@graphiql/plugin-query-builder': patch
---

Tune light theme tokens so borders, muted text, and several accent colors meet WCAG AA contrast. Dividers between panels are easier to see, disabled/dim text is more legible, and the orange and purple accent colors read correctly against light backgrounds. The green/red status buttons and the query builder's "inline argument" toggle now use white text in light theme so they stay readable.
