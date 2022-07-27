---
"vscode-graphql": patch
---

support vscode multi-root workspaces! creates an LSP server instance for each workspace.

WARNING: large-scale vscode workspaces usage, and this in tandem with `graphql.config.*` multi-project configs could lead to excessive system resource usage. Optimizations coming soon.
