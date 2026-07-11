---
'@graphiql/react': patch
---

Fix the Table view's row divider disappearing because it referenced the undefined `--border-subtle` custom property. Row bottom borders now use `--border-muted`, matching the token set defined in `tokens.css`.
