---
'vscode-graphql-syntax': patch
---

Highlight GraphQL string values — including single-line and block (triple-quoted) strings in directive and field arguments, list items, and default values — as strings instead of comments. Descriptions are now scoped as documentation (`comment.block.documentation` / `comment.line.documentation`) so themes can style them distinctly while still defaulting to comment colors.
